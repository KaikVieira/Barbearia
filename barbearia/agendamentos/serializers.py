from datetime import datetime, timedelta
from rest_framework import serializers

from .models import Horario, HorarioFixo, Servico, ConfiguracaoHorario
from barbearia.clientes.serializers import ClienteSerializer
from barbearia.clientes.models import Cliente


# ------------------------------------------
# 🔹 SERVIÇO
# ------------------------------------------
class ServicoSerializer(serializers.ModelSerializer):
    duracao_formatada = serializers.SerializerMethodField()

    class Meta:
        model = Servico
        fields = ["id", "nome", "duracao_minutos", "duracao_formatada", "preco"]

    def get_duracao_formatada(self, obj):
        horas = obj.duracao_minutos // 60
        minutos = obj.duracao_minutos % 60
        if horas and minutos:
            return f"{horas}h {minutos}min"
        elif horas:
            return f"{horas}h"
        return f"{minutos}min"


# ------------------------------------------
# 🔹 HORÁRIO FIXO
# ------------------------------------------
class HorarioFixoSerializer(serializers.ModelSerializer):
    dia_semana_nome = serializers.SerializerMethodField()

    class Meta:
        model = HorarioFixo
        fields = ["id", "dia_semana", "dia_semana_nome", "hora", "senha"]

    def get_dia_semana_nome(self, obj):
        return obj.get_dia_semana_display()


# ------------------------------------------
# 🔹 HORÁRIO (AGENDAMENTO)
# ------------------------------------------
class HorarioSerializer(serializers.ModelSerializer):
    # 🔹 Leitura
    cliente = ClienteSerializer(read_only=True)
    servicos = ServicoSerializer(many=True, read_only=True)

    # 🔹 Escrita
    cliente_id = serializers.PrimaryKeyRelatedField(
        queryset=Cliente.objects.all(),
        source="cliente",
        write_only=True
    )
    servicos_id = serializers.PrimaryKeyRelatedField(
        queryset=Servico.objects.all(),
        source="servicos",
        many=True,
        write_only=True
    )

    # 🔹 Campos calculados
    status_dinamico = serializers.SerializerMethodField()
    fim_estimado = serializers.SerializerMethodField()

    class Meta:
        model = Horario
        fields = [
            "id",
            "data",
            "hora",
            "senha",
            "status",
            "status_dinamico",
            "cliente",
            "cliente_id",
            "servicos",
            "servicos_id",
            "fim_estimado",
        ]

    # ------------------------------------------
    # 🔹 STATUS DINÂMICO (UI)
    # ------------------------------------------
    def get_status_dinamico(self, obj):
        if not obj.data or not obj.hora:
            return {"cor": "cinza", "texto": "Indisponível"}

        # 🔴 Cancelado
        if obj.status == "cancelado":
            return {"cor": "cinza", "texto": "Cancelado"}

        agora = datetime.now()
        data_hora = datetime.combine(obj.data, obj.hora)
        delta = data_hora - agora

        if obj.status == "atendido":
            return {"cor": "verde", "texto": "Atendido"}
        elif obj.status == "agendado":
            return {"cor": "amarelo", "texto": "Agendado"}
        elif timedelta(0) < delta <= timedelta(minutes=15):
            return {"cor": "azul", "texto": "Aguardando"}
        elif delta <= timedelta(0):
            return {"cor": "vermelho", "texto": "Pendente"}
        else:
            return {"cor": "cinza", "texto": "Disponível"}

    # ------------------------------------------
    # 🔹 FIM ESTIMADO
    # ------------------------------------------
    def get_fim_estimado(self, obj):
        if not obj.hora or not obj.servicos.exists():
            return None

        inicio = datetime.combine(obj.data, obj.hora)
        total_duracao = sum(s.duracao_minutos for s in obj.servicos.all())

        config = ConfiguracaoHorario.objects.first()
        if config:
            total_duracao += config.tolerancia_minutos

        fim = inicio + timedelta(minutes=total_duracao)
        return fim.strftime("%H:%M")
