from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HorarioViewSet, ServicoViewSet, HorarioFixoViewSet
from .views import ClienteViewSet

router = DefaultRouter()
router.register(r'horarios', HorarioViewSet, basename='horario')
router.register(r'servicos', ServicoViewSet, basename='servico')
router.register(r'horarios-fixos', HorarioFixoViewSet, basename='horario-fixo')
router.register(r'clientes', ClienteViewSet, basename='cliente')

urlpatterns = [
    path('', include(router.urls)),  # <-- sem 'api/' aqui
]
