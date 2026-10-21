# Documento de Escopo e Arquitetura
## Sistema de Controle de Aluguel de Mesas e Cadeiras

---

## 1. Visão Geral do Projeto
O sistema tem como objetivo automatizar e organizar o processo de atendimento, precificação, controle de estoque rotativo e logística de entregas/recolhimentos para uma loja física de aluguel de mesas e cadeiras.

### Stack Tecnológica
* **Backend:** NestJS (Node.js + TypeScript)
* **Frontend:** React + TypeScript (Vite + Tailwind CSS / UI Library)
* **Banco de Dados:** PostgreSQL

---

## 2. Regras de Negócio e Precificação

### Tabela de Preços
* **Cadeira ou Mesa Avulsa:**
  * **1 a 10 unidades:** R$ 3,00 por unidade.
  * **Acima de 10 unidades:** R$ 2,00 por unidade.
* **Combo (Conjunto 4+1):**
  * 1 Mesa + 4 Cadeiras = **R$ 10,00** por conjunto.

### Regras de Estoque e Status
* **Mesa na Rua:** Item entregue ao cliente e ainda não recolhido.
* **Estoque Disponível:** Total do Estoque Físico - Itens Atualmente Alugados (na rua).

---

## 3. Estrutura do Banco de Dados (PostgreSQL)

### Modelagem de Entidades (DDL / Relacionamentos)

```sql
-- Tabela de Configurações / Estoque Total da Loja
CREATE TABLE estoque_config (
    id SERIAL PRIMARY KEY,
    total_mesas INT NOT NULL DEFAULT 0,
    total_cadeiras INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Clientes
CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(150) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    endereco TEXT NOT NULL,
    bairro VARCHAR(100),
    ponto_referencia TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enum para Status do Pedido
CREATE TYPE status_pedido_enum AS ENUM (
    'PENDENTE_ENTREGA', 
    'ENTREGUE', 
    'PENDENTE_RECOLHIMENTO', 
    'FINALIZADO', 
    'CANCELADO'
);

-- Tabela de Pedidos
CREATE TABLE pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
    data_entrega DATE NOT NULL,
    data_recolhimento DATE NOT NULL,
    status status_pedido_enum NOT NULL DEFAULT 'PENDENTE_ENTREGA',
    valor_total DECIMAL(10, 2) NOT NULL,
    observacao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enum para Tipos de Itens do Pedido
CREATE TYPE tipo_item_enum AS ENUM (
    'MESA_AVULSA', 
    'CADEIRA_AVULSA', 
    'COMBO_CONJUNTO'
);

-- Tabela de Itens do Pedido
CREATE TABLE itens_pedido (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    tipo_item tipo_item_enum NOT NULL,
    quantidade INT NOT NULL,
    preco_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL
);

-- Índices para otimização de consultas da logística e dashboard
CREATE INDEX idx_pedidos_data_entrega ON pedidos(data_entrega);
CREATE INDEX idx_pedidos_data_recolhimento ON pedidos(data_recolhimento);
CREATE INDEX idx_pedidos_status ON pedidos(status);
```

---

## 4. Lista de Funcionalidades por Módulo

### A. Módulo de Atendimento / Balcão (Tia)
1. **Gestão de Clientes:**
   * Cadastro, edição e busca rápida por nome ou telefone.
2. **Criação de Pedidos:**
   * Seleção do cliente e definição das datas (Entrega e Recolhimento).
   * Adição de itens (Quantidade de mesas avulsas, cadeiras avulsas ou combos).
   * Cálculo automático de preços com aplicação de descontos por volume e valor de combos.
3. **Consulta e Histórico:**
   * Listagem detalhada de todos os pedidos executados e agendados.
   * Filtro por período e por status.

### B. Módulo de Logística / Entregador (Tio - Mobile Friendly)
1. **Lista do Dia (Interface Simplificada):**
   * Visualização das **Entregas de Hoje** e **Recolhimentos de Hoje**.
2. **Ações Rápidas por Pedido:**
   * Visualizar endereço completo e itens a serem entregues/recolhidos.
   * Botão direto para **Abrir no Waze / Google Maps**.
   * Botão direto para **Ligar / WhatsApp** do cliente.
3. **Atualização de Status Operacional:**
   * Confirmar entrega (**Marcar como Entregue** -> Muda status para `ENTREGUE`).
   * Confirmar recolhimento (**Marcar como Recolhido** -> Muda status para `FINALIZADO`).

### C. Módulo Dashboard & Estatísticas
1. **Métricas Principais (KPIs):**
   * Total Faturado (Hoje, Mês Atual e Período Customizado).
   * Total de Mesas e Cadeiras **na rua** (atualmente em posse de clientes).
   * Quantidade de Entregas e Recolhimentos programados para o dia.
2. **Controle de Estoque Rotativo:**
   * Indicação em tempo real de quantas mesas/cadeiras estão disponíveis na loja para novos aluguéis.
3. **Avisos e Alertas:**
   * Destaque para pedidos com recolhimento em atraso (passaram da data e não foram finalizados).

---

## 5. Fluxo Operacional Novo (Passo a Passo)

```
[1. BALCÃO - Atendimento]
   │
   ├── Client chega na loja / liga.
   ├── Tia cadastra/seleciona o cliente no React.
   ├── Tia insere a quantidade de mesas/cadeiras e datas (Entrega e Recolhimento).
   ├── O sistema (NestJS) calcula o valor total aplicando regras/combos.
   └── Pedido salvo com status "PENDENTE_ENTREGA".
   │
[2. DIA DA ENTREGA - Logística]
   │
   ├── Tio abre a página do Entregador no celular/tablet.
   ├── Visualiza a lista de "Entregas do Dia" com quantidade exata para carregar no caminhão.
   ├── Clica no botão para abrir o endereço direto no GPS.
   ├── Realiza a entrega no endereço.
   └── Clica em "Marcar como Entregue" -> Status altera para "ENTREGUE".
   │
[3. USO / MONITORAMENTO - Dashboard]
   │
   ├── Durante o período do aluguel, o Dashboard contabiliza os itens como "Na Rua".
   └── O sistema abate esses itens do estoque disponível para novos aluguéis na mesma data.
   │
[4. DIA DO RECOLHIMENTO - Logística]
   │
   ├── Tio visualiza a lista de "Recolhimentos do Dia" no seu painel.
   ├── Vai ao endereço do cliente e busca as mesas/cadeiras.
   └── Clica em "Marcar como Recolhido" -> Status altera para "FINALIZADO".
   │
[5. FINALIZAÇÃO]
   │
   └── Itens retornam ao estoque disponível da loja e o faturamento é consolidado.
```