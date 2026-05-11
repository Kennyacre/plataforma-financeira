async function pagarFatura(nome) {
    if(!confirm(`Deseja confirmar o pagamento da fatura do cartão ${nome}? O limite será restaurado.`)) return;

    const res = await fetch('/api/cartoes/pagar-fatura', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            username: user,
            nome_cartao: nome
        })
    });

    const result = await res.json();
    if(res.ok && result.status === "sucesso") {
        alert("🎉 Fatura paga! Seu limite foi restaurado.");
        carregarCartoes();
    } else {
        alert(result.detalhe || "Erro ao processar pagamento.");
    }
}