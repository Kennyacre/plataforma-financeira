#!/bin/bash
# Configuração de Hardware - Fans e Rede Giga LAN

echo "Configurando fans para sempre ligadas..."
# Procura por dispositivos de resfriamento do tipo 'Fan'
for fan in /sys/class/thermal/cooling_device*; do
    if [ -f "$fan/type" ]; then
        type=$(cat "$fan/type")
        if [ "$type" == "Fan" ]; then
            max=$(cat "$fan/max_state")
            echo $max > "$fan/cur_state"
            echo "Fan $(basename $fan) definida para velocidade máxima ($max)"
        fi
    fi
done

echo "Configurando rede enp2s0 para Giga LAN (1000Mbps)..."
if command -v ethtool > /dev/null; then
    ethtool -s enp2s0 speed 1000 duplex full autoneg on
    echo "Rede enp2s0 configurada com sucesso."
else
    echo "Aviso: ethtool não encontrado."
fi

echo "Desativando economia de energia USB (para as fans extras)..."
for d in /sys/bus/usb/devices/*/power/control; do
    echo "on" > "$d" 2>/dev/null
done
echo "0" > /sys/module/usbcore/parameters/autosuspend 2>/dev/null
echo "Economia de energia USB desativada."

echo "Protegendo o botão de energia (evitar desligamento acidental)..."
# Nota: Isso requer alteração no /etc/systemd/logind.conf que faremos via sed se houver permissão
# Mas como precaução, vamos apenas logar que isso deve ser feito manualmente se o script falhar
if [ -f /etc/systemd/logind.conf ]; then
    sed -i 's/#HandlePowerKey=poweroff/HandlePowerKey=ignore/' /etc/systemd/logind.conf 2>/dev/null
    sed -i 's/HandlePowerKey=poweroff/HandlePowerKey=ignore/' /etc/systemd/logind.conf 2>/dev/null
fi

echo "Limitando consumo da CPU (Power Capping) para estabilidade da fonte..."
# PL1 (Long Term) = 15W, PL2 (Short Term) = 25W
# Valores em microwatts (uw)
if [ -d /sys/class/powercap/intel-rapl:0 ]; then
    echo 15000000 > /sys/class/powercap/intel-rapl:0/constraint_0_power_limit_uw 2>/dev/null
    echo 25000000 > /sys/class/powercap/intel-rapl:0/constraint_1_power_limit_uw 2>/dev/null
    echo "Limites de energia aplicados: 15W/25W."
else
    echo "Aviso: Controlador intel-rapl não encontrado. Verifique se o módulo 'intel_rapl_msr' está carregado."
fi

echo "Configuração finalizada com sucesso!"
