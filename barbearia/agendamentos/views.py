from datetime import date, datetime, timedelta, time

from django.utils import timezone
from django.db import models
from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import JSONParser

from .models import (
    Horario,
    Servico,
    HorarioFixo,
    DiaFechado
)

from barbearia.clientes.models import Cliente

from .serializers import (
    HorarioSerializer,
    ServicoSerializer,
    HorarioFixoSerializer
)

# =====================================================
# 🔹 CLIENTES
# =====================================================
class ClienteViewSet(viewsets.ViewSet):

    @action(detail=False, methods=["get"])
    def por_telefone(self, request):
        telefone = request.query_params.get("telefone")

        if not telefone:
            return Response(
                {"erro": "Telefone é obrigatório"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            cliente = Cliente.objects.get(telefone=telefone)
        except Cliente.DoesNotExist:
            return Response({"existe": False}, status=status.HTTP_200_OK)

        return Response({
            "existe": True,
            "cliente": {
                "id": cliente.id,
                "nome": cliente.nome,
                "telefone": cliente.telefone
            }
        })


# =====================================================
# 🔹 HORÁRIOS / AGENDAMENTOS
# =====================================================
class HorarioViewSet(viewsets.ModelViewSet):
    queryset = Horario.objects.all().order_by("data", "hora")
    serializer_class = HorarioSerializer

    # =====================================================
    # 🔹 HORÁRIOS DISPONÍVEIS
    # =====================================================
    @action(detail=False, methods=["get"])
    def disponiveis(self, request):
        data_str = request.query_params.get("data")
        duracao_param = request.query_params.get("duracao")

        if not data_str or not duracao_param:
            return Response(
                {"erro": "Data e duração são obrigatórias"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            data_obj = datetime.strptime(data_str, "%Y-%m-%d").date()
            duracao_total = int(duracao_param)
        except ValueError:
            return Response(
                {"erro": "Parâmetros inválidos"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if data_obj < date.today():
            return Response(
                {"erro": "Data no passado"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if DiaFechado.objects.filter(data=data_obj).exists():
            return Response({
                "data": data_str,
                "fechado": True,
                "horarios_disponiveis": []
            })

        # ⏰ CONFIGURAÇÕES FIXAS
        hora_inicio = time(8, 30)
        hora_fim = time(19, 30)
        almoco_inicio = time(11, 0)
        almoco_fim = time(13, 30)

        passo = timedelta(minutes=30)
        agora = timezone.localtime()

        horarios_existentes = Horario.objects.filter(
            data=data_obj,
            status__in=["pendente", "aguardando", "agendado"]
        ).prefetch_related("servicos")

        atual = timezone.make_aware(datetime.combine(data_obj, hora_inicio))
        fim_dia = timezone.make_aware(datetime.combine(data_obj, hora_fim))

        horarios_disponiveis = []

        while atual + timedelta(minutes=duracao_total) <= fim_dia:
            fim_servico = atual + timedelta(minutes=duracao_total)

            # ⛔ NÃO MOSTRAR HORÁRIO PASSADO
            if data_obj == agora.date() and atual <= agora:
                atual += passo
                continue

            # 🍽️ BLOQUEIO DE ALMOÇO
            if not (
                fim_servico.time() <= almoco_inicio
                or atual.time() >= almoco_fim
            ):
                atual = timezone.make_aware(
                    datetime.combine(data_obj, almoco_fim)
                )
                continue

            conflito = False

            for h in horarios_existentes:
                h_inicio = timezone.make_aware(
                    datetime.combine(h.data, h.hora)
                )

                duracao_h = sum(
                    s.duracao_minutos for s in h.servicos.all()
                )

                h_fim = h_inicio + timedelta(minutes=duracao_h)

                if not (fim_servico <= h_inicio or atual >= h_fim):
                    conflito = True
                    break

            if not conflito:
                horarios_disponiveis.append(atual.strftime("%H:%M"))

            atual += passo

        return Response({
            "data": data_str,
            "fechado": False,
            "horarios_disponiveis": horarios_disponiveis
        })

    # =====================================================
    # 🔹 AGENDAR
    # =====================================================
    @action(detail=False, methods=["post"])
    def agendar(self, request):
        data_agendamento = request.data.get("data")
        hora_str = request.data.get("hora")
        telefone = request.data.get("telefone")
        servicos_ids = request.data.get("servicos_id")

        if not data_agendamento or not hora_str or not telefone:
            return Response(
                {"erro": "Data, hora e telefone são obrigatórios"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not servicos_ids or not isinstance(servicos_ids, list):
            return Response(
                {"erro": "Serviços inválidos"},
                status=status.HTTP_400_BAD_REQUEST
            )

        cliente, _ = Cliente.objects.get_or_create(
            telefone=telefone.strip(),
            defaults={"nome": "Cliente"}
        )

        servicos = Servico.objects.filter(id__in=servicos_ids)
        if servicos.count() != len(servicos_ids):
            return Response(
                {"erro": "Serviços não encontrados"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            data_obj = datetime.strptime(data_agendamento, "%Y-%m-%d").date()
            hora_obj = datetime.strptime(hora_str, "%H:%M").time()
        except ValueError:
            return Response(
                {"erro": "Data ou hora inválida"},
                status=status.HTTP_400_BAD_REQUEST
            )

        inicio = timezone.make_aware(datetime.combine(data_obj, hora_obj))
        agora = timezone.localtime()

        if inicio <= agora:
            return Response(
                {"erro": "Horário no passado"},
                status=status.HTTP_400_BAD_REQUEST
            )

        duracao_total = sum(s.duracao_minutos for s in servicos)
        fim = inicio + timedelta(minutes=duracao_total)

        # 🍽️ BLOQUEIO DE ALMOÇO
        almoco_inicio = time(11, 0)
        almoco_fim = time(13, 30)

        if not (
            fim.time() <= almoco_inicio
            or inicio.time() >= almoco_fim
        ):
            return Response(
                {"erro": "Horário indisponível (almoço)"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ⛔ CONFLITOS
        for h in Horario.objects.filter(
            data=data_obj,
            status__in=["pendente", "aguardando", "agendado"]
        ).prefetch_related("servicos"):

            h_inicio = timezone.make_aware(datetime.combine(h.data, h.hora))
            duracao_h = sum(s.duracao_minutos for s in h.servicos.all())
            h_fim = h_inicio + timedelta(minutes=duracao_h)

            if not (fim <= h_inicio or inicio >= h_fim):
                return Response(
                    {"erro": "Conflito de horário"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        ultima = Horario.objects.filter(data=data_obj).order_by("-senha").first()
        nova_senha = ultima.senha + 1 if ultima and ultima.senha else 1

        horario = Horario.objects.create(
            data=data_obj,
            hora=hora_obj,
            cliente=cliente,
            status="agendado",
            senha=nova_senha
        )

        horario.servicos.set(servicos)

        return Response(
            HorarioSerializer(horario).data,
            status=status.HTTP_201_CREATED
        )

    # =====================================================
    # 🔹 MEUS HORÁRIOS (🔥 CORRIGIDO AQUI 🔥)
    # =====================================================
    @action(detail=False, methods=["get"])
    def meus_horarios(self, request):
        telefone = request.query_params.get("telefone")

        if not telefone:
            return Response(
                {"erro": "Telefone é obrigatório"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            cliente = Cliente.objects.get(telefone=telefone)
        except Cliente.DoesNotExist:
            return Response([], status=status.HTTP_200_OK)

        agora = timezone.localtime()

        horarios = Horario.objects.filter(
            cliente=cliente,
            status__in=["pendente", "aguardando", "agendado"]
        ).filter(
            Q(data__gt=agora.date()) |
            Q(data=agora.date(), hora__gte=agora.time())
        ).prefetch_related("servicos").order_by("data", "hora")

        return Response(HorarioSerializer(horarios, many=True).data)

    # =====================================================
    # 🔹 CANCELAR
    # =====================================================
    @action(detail=True, methods=["patch"])
    def cancelar(self, request, pk=None):
        horario = self.get_object()

        if horario.status == "cancelado":
            return Response(
                {"erro": "Horário já cancelado"},
                status=status.HTTP_400_BAD_REQUEST
            )

        horario.status = "cancelado"
        horario.cancelado_em = timezone.now()
        horario.save()

        return Response({"sucesso": True})


# =====================================================
# 🔹 SERVIÇOS
# =====================================================
class ServicoViewSet(viewsets.ModelViewSet):
    queryset = Servico.objects.all()
    serializer_class = ServicoSerializer


# =====================================================
# 🔹 HORÁRIOS FIXOS
# =====================================================
class HorarioFixoViewSet(viewsets.ModelViewSet):
    queryset = HorarioFixo.objects.all()
    serializer_class = HorarioFixoSerializer
    parser_classes = [JSONParser]
