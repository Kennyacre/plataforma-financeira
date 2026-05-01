from pydantic import BaseModel
from typing import Optional

class LoginRequest(BaseModel):
    username: str
    password: str

class LancamentoRequest(BaseModel):
    username: str
    tipo: str
    descricao: str
    valor: float
    data: str
    categoria: str
    pagamento: str
    repetir: str
    quantidade: int
    status: Optional[str] = 'pago'

class PedidoCredito(BaseModel):
    username: str
    quantidade: int

class NovoPacote(BaseModel):
    nome: str
    creditos: int
    valor: float

class RespostaSolicitacao(BaseModel):
    id_solicitacao: int
    acao: str

class NovoClienteAdmin(BaseModel):
    username: str
    password: str
    dias_acesso: int
class NovoRevendedor(BaseModel):
    username: str
    password: str
    creditos_iniciais: int

class NovoClienteRevenda(BaseModel):
    username: str
    password: str
    dias_acesso: int
    revendedor: str
    tipo_conta: str # 'teste' ou 'oficial'

class CategoriaRequest(BaseModel):
    username: str
    nome: str
    tipo: str
    cor: str = "#3b82f6"

class FormaPagamentoRequest(BaseModel):
    username: str
    nome: str

class MetaRequest(BaseModel):
    username: str
    categoria: str
    limite: float

class PerfilUpdate(BaseModel):
    username: str
    nome_completo: str
    email: Optional[str] = None

class ManualRegistrationRequest(BaseModel):
    username: str
    password: str
    email: str
    nome_completo: str = ""
    id_indicacao: Optional[int] = None

class UsuarioUpdateAdmin(BaseModel):
    nome_completo: Optional[str] = None
    email: Optional[str] = None
    vencimento: Optional[str] = None
    status: Optional[str] = None
    is_premium: Optional[bool] = None

