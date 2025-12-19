from django.urls import path

from . import views

app_name = 'wawitest'

urlpatterns = [
    path('', views.dashboard_home, name='dashboard'),
    path('test/wawi/create/', views.create_document, name='create'),
    path('test/wawi/retry/<int:document_id>/', views.retry_document, name='retry'),
    path('test/wawi/fail/<int:document_id>/', views.force_fail, name='fail'),
    path('test/wawi/run-one/', views.run_one, name='run_one'),
]
