from django.contrib import admin
from .models import Horario, Servico, HorarioFixo, DiaFechado


@admin.register(Servico)
class ServicoAdmin(admin.ModelAdmin):
    list_display = ('nome', 'duracao_minutos', 'preco')
    search_fields = ('nome',)


@admin.register(Horario)
class HorarioAdmin(admin.ModelAdmin):
    list_display = (
        'data',
        'hora',
        'get_cliente',
        'get_servicos',
        'status',
        'senha'
    )
    list_filter = ('data', 'status')
    search_fields = ('cliente__nome', 'servicos__nome')
    readonly_fields = ('senha',)
    ordering = ('-data', 'hora')

    def get_cliente(self, obj):
        return obj.cliente.nome if obj.cliente else '-'
    get_cliente.short_description = 'Cliente'

    def get_servicos(self, obj):
        return ", ".join(s.nome for s in obj.servicos.all())
    get_servicos.short_description = 'Serviços'


@admin.register(HorarioFixo)
class HorarioFixoAdmin(admin.ModelAdmin):
    list_display = ('get_dia_semana', 'hora', 'senha')
    list_filter = ('dia_semana',)
    ordering = ('dia_semana', 'hora')

    def get_dia_semana(self, obj):
        return obj.get_dia_semana_display()
    get_dia_semana.short_description = 'Dia da Semana'


@admin.register(DiaFechado)
class DiaFechadoAdmin(admin.ModelAdmin):
    list_display = ('data', 'motivo')
    search_fields = ('motivo',)
    ordering = ('-data',)
