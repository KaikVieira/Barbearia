import requests

EVOLUTION_API_URL = "http://seu_ip:8080/api/sendMessage"
TOKEN = "SEU_TOKEN"

def enviar_whatsapp(numero, mensagem):
    payload = {
        "number": numero,
        "text": mensagem
    }
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json"
    }
    response = requests.post(EVOLUTION_API_URL, json=payload, headers=headers)
    return response.status_code
