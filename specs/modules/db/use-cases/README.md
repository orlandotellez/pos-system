# Casos de Uso — POS System

Diagramas de flujo funcionales con Mermaid para los flujos más críticos de la plataforma.

> **Criterio**: solo se documentan use-cases donde la lógica de negocio es **compleja** o tiene **múltiples tablas en transacción**. CRUDs simples (GET / POST una sola tabla) NO necesitan diagrama.

## Listado

| # | Caso de Uso | Tablas involucradas |
|---|---|---|
| 1 | [Registro de tienda (onboarding)](./01-registro-de-tienda.md) | stores, users, accounts, settings, sessions |
| 2 | [Flujo de venta (POS)](./02-flujo-de-venta.md) | sales, sale_items, sale_services, sale_service_products, products, inventory_movements |
| 3 | [Movimientos de stock (batch + individual)](./03-movimientos-de-stock.md) | inventory_batches, inventory_batch_items, products, inventory_movements |
