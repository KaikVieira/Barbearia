from django.contrib import admin
from .models import Horario, Servico

# Registrar modelos para aparecer no Admin
admin.site.register(Servico)
admin.site.register(Horario)
