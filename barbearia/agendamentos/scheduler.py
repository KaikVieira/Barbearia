from datetime import date, timedelta

def gerar_horarios_automaticos():
    # Importa os modelos dentro da função, evitando problemas de AppRegistryNotReady
    from .models import HorarioFixo, Horario, DiaFechado

    hoje = date.today()
    limite = hoje + timedelta(days=60)  # gera 2 meses pra frente

    dias_fechados = set(DiaFechado.objects.values_list("data", flat=True))

    for dia in (hoje + timedelta(days=i) for i in range((limite - hoje).days + 1)):
        if dia in dias_fechados:
            continue

        dia_semana = dia.weekday()  # 0=segunda, 6=domingo
        horarios_fixos = HorarioFixo.objects.filter(dia_semana=dia_semana)

        for fixo in horarios_fixos:
            if not Horario.objects.filter(data=dia, hora=fixo.hora).exists():
                Horario.objects.create(
                    data=dia,
                    hora=fixo.hora,
                    status="disponível",
                    senha=fixo.senha
                )
