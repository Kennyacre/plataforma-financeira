#!/bin/bash

# ==========================================================
# Coletor de Consumo de Energia - MTConnect V2
# ==========================================================
# Este script deve ser executado na máquina HOST (física)
# onde o servidor está rodando, preferencialmente via Cron:
#
# Exemplo de Crontab (rodar a cada 5 minutos):
# */5 * * * * /caminho/para/este/script/coletar_energia.sh
# ==========================================================

API_URL="http://127.0.0.1:8501/api/admin/energia" # Ou IP externo se rodar remotamente
WATTS=0

# MODO 1: Intel RAPL (Servidores / Desktops modernos)
# Lê a energia em microjoules e converte para Watts
if [ -f "/sys/class/powercap/intel-rapl/intel-rapl:0/energy_uj" ]; then
    if [ ! -r "/sys/class/powercap/intel-rapl/intel-rapl:0/energy_uj" ]; then
        echo "PERMISSÃO NEGADA. Execute este script como ROOT (sudo crontab -e)"
        # Para evitar ficar travado, enviamos 0 W
        WATTS=0
    else
        # Ler valor 1
        UJ1=$(cat /sys/class/powercap/intel-rapl/intel-rapl:0/energy_uj)
        sleep 1
        # Ler valor 2
        UJ2=$(cat /sys/class/powercap/intel-rapl/intel-rapl:0/energy_uj)
        
        # Delta em uJ por segundo (Watts = Joules por segundo)
        DIFF=$(($UJ2 - $UJ1))
        
        # Se DIFF for negativo, o contador resetou, ignora essa leitura
        if [ $DIFF -ge 0 ]; then
            # Converter de microjoules (uJ) para Watts (dividir por 1.000.000)
            WATTS=$(awk -v diff="$DIFF" 'BEGIN { printf "%.2f", diff / 1000000 }')
        fi
    fi

# MODO 2: ipmitool (Servidores HP / Dell)
# Descomente as linhas abaixo se o seu servidor usa IPMI
# elif command -v ipmitool &> /dev/null; then
#    # Captura a linha que diz "Instantaneous power reading" e extrai o número
#    WATTS=$(ipmitool dcmi power reading | grep "Instantaneous power reading" | awk '{print $4}')

else
    echo "Nenhuma fonte de leitura de energia configurada/encontrada."
    # Para testes, podemos gerar um valor aleatório entre 50 e 150
    # WATTS=$(shuf -i 50-150 -n 1)
    exit 1
fi

if [ $(echo "$WATTS > 0" | bc -l 2>/dev/null || echo 1) -eq 1 ]; then
    echo "Enviando leitura: $WATTS W para $API_URL"
    
    # Envia via POST para o painel em formato JSON
    curl -s -X POST "$API_URL" \
         -H "Content-Type: application/json" \
         -d "{\"watts\": $WATTS}"
else
    echo "Erro ao ler consumo (Watts = $WATTS)"
fi
