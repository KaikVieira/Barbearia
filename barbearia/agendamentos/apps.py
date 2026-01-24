from django.apps import AppConfig
from apscheduler.schedulers.background import BackgroundScheduler

class AgendamentosConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'barbearia.agendamentos'

    def ready(self):
        from django.conf import settings
        if settings.DEBUG:
            # Importa a função apenas quando os apps estão carregados
            from .scheduler import gerar_horarios_automaticos
            
            scheduler = BackgroundScheduler()
            # Agenda para rodar todos os dias à meia-noite
            scheduler.add_job(gerar_horarios_automaticos, 'cron', hour=0, minute=0)
            scheduler.start()
