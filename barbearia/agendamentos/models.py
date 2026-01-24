from django.db import models
from datetime import datetime, timedelta, date
from django.utils import timezone
from barbearia.clientes.models import Cliente


class Servico(models.Model):
    nome = models.CharField(max_length=100)
    duracao_minutos = models.PositiveIntegerField(
        help_text="Duração em minutos (ex: 30, 60, 90)"
    )
    preco = models.DecimalField(max_digits=8, decimal_places=2)

    def __str__(self):
        return f"{self.nome} ({self.duracao_minutos} min)"


class ConfiguracaoHorario(models.Model):
    hora_inicio_expediente = models.TimeField(default="09:00")
    hora_fim_expediente = models.TimeField(default="18:00")
    almoco_inicio = models.TimeField(default="12:00")
    almoco_fim = models.TimeField(default="13:00")
    tolerancia_minutos = models.PositiveIntegerField(default=10)

    def __str__(self):
        return "Configuração de Horários"

    class Meta:
        verbose_name_plural = "Configurações de Horário"


class HorarioFixo(models.Model):
    DIA_DA_SEMANA_CHOICES = [
        (0, "Segunda"),
        (1, "Terça"),
        (2, "Quarta"),
        (3, "Quinta"),
        (4, "Sexta"),
        (5, "Sábado"),
        (6, "Domingo"),
    ]

    dia_semana = models.IntegerField(choices=DIA_DA_SEMANA_CHOICES)
    hora = models.TimeField()
    senha = models.PositiveIntegerField(blank=True, null=True)

    class Meta:
        unique_together = ("dia_semana", "hora")
        ordering = ["dia_semana", "hora"]

    def __str__(self):
        return f"{self.get_dia_semana_display()} {self.hora.strftime('%H:%M')}"


class DiaFechado(models.Model):
    data = models.DateField(unique=True)
    motivo = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"{self.data} - {self.motivo or 'Fechado'}"

    class Meta:
        verbose_name_plural = "Dias Fechados"


class Horario(models.Model):
    STATUS_CHOICES = [
        ("pendente", "Pendente"),
        ("aguardando", "Aguardando"),
        ("agendado", "Agendado"),
        ("cancelado", "Cancelado"),
        ("atendido", "Atendido"),
    ]

    data = models.DateField(default=date.today)
    hora = models.TimeField()

    senha = models.PositiveIntegerField(blank=True, null=True)

    cliente = models.ForeignKey(
        Cliente,
        on_delete=models.CASCADE,
        related_name="horarios"
    )

    servicos = models.ManyToManyField(
        Servico,
        related_name="agendamentos",
        blank=True
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pendente"
    )

    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)
    cancelado_em = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["data", "hora"]

    def __str__(self):
        return f"{self.data} {self.hora.strftime('%H:%M')}"

    @property
    def duracao_total(self):
        total = sum(s.duracao_minutos for s in self.servicos.all())
        config = ConfiguracaoHorario.objects.first()
        if config:
            total += config.tolerancia_minutos
        return total

    @property
    def hora_fim(self):
        inicio = datetime.combine(self.data, self.hora)
        fim = inicio + timedelta(minutes=self.duracao_total)
        return fim.time()

    def pode_cancelar(self):
        agora = timezone.localtime()

        data_hora = timezone.make_aware(
            datetime.combine(self.data, self.hora)
        )

    # tolerância de 1 minuto
        limite_cancelamento = data_hora + timedelta(minutes=1)

        if self.status in ["cancelado", "atendido"]:
            return False

        return agora <= limite_cancelamento
