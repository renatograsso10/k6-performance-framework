# K6 Performance Framework

Projeto de estudo para testes de performance com [Grafana k6](https://grafana.com/docs/k6/). Inclui Smoke, Load, Stress, Spike, Soak, Endurance e Breakpoint, com fixture local, relatórios HTML/JSON e execução no GitHub Actions.

## Requisitos

- k6 1.5.0
- Node.js 22+
- Docker com Compose, somente para o laboratório SWAPI local

## Começando

```bash
npm test
node scripts/run-k6-with-fixture.mjs tests/smoke.test.js --iterations 1
```

O primeiro comando valida configuração, runtime, retries, métricas, relatórios, workloads, pipeline e todos os entrypoints. O segundo reproduz o Smoke Test contra uma fixture local, sem depender da internet.

## Targets

`swapi.info` é um serviço público de terceiros. Por segurança:

- somente `external-smoke` pode chamar o SWAPI público;
- o probe público usa 1 VU, 1 req/s, 60 segundos, sem retry, e não bloqueia a pipeline;
- Smoke da CI usa fixture local;
- perfis de carga exigem target controlado;
- relatórios HTML públicos ocultam URLs controladas; o JSON do artefato mantém a URL para diagnóstico.

Execução contra ambiente próprio:

```bash
BASE_URL=https://performance.example.internal \
  k6 run --env TARGET_KIND=controlled-remote tests/load.test.js
```

```powershell
$env:BASE_URL = 'https://performance.example.internal'
$env:TARGET_KIND = 'controlled-remote'
k6 run tests/load.test.js
```

Probe público:

```bash
npm run external-smoke
```

Ele mede disponibilidade, DNS/TLS, CDN/cache e latência de borda. Não mede capacidade do backend.

## Laboratório SWAPI

O laboratório sobe uma revisão pinada do SWAPI em `127.0.0.1:3000`, espera o health check, executa o perfil e desmonta o ambiente.

```bash
npm run lab:smoke
npm run lab:load
npm run lab:stress
```

`lab:load` executa 20 req/s durante 10 minutos. A agenda semanal da CI usa esse laboratório self-hosted; não gera carga no SWAPI público.

## Configuração

| Variável | Default | Uso |
|---|---|---|
| `BASE_URL` | `https://swapi.info` | target da execução |
| `ENVIRONMENT` | `production` | `production`, `staging` ou `development` |
| `REQUEST_TIMEOUT` | `30s` | timeout por request |
| `MAX_RETRIES` | `0` | retries para respostas 5xx |
| `RUN_ID` | `local` | correlação de logs, métricas e relatórios |
| `TARGET_KIND` | `unspecified` | origem do target |
| `HTTP_LOG_SAMPLE_RATE` | `0` | amostragem de logs HTTP entre 0 e 1 |

## Resultados e thresholds

Thresholds nativos do k6 determinam PASS/FAIL. O exit code controla o resultado da execução; HTML e JSON apenas refletem os outcomes do k6. Zero requests resulta em `NO DATA`, nunca `PASSED`.

Relatórios são gravados em `reports/`. Cada tentativa HTTP concluída emite uma amostra de `api_response_time` e `success_rate`; retries contam como novas tentativas.

Exit code `99` indica threshold reprovado. Verifique no output qual métrica falhou antes de alterar SLO ou carga.

## CI

O workflow `.github/workflows/k6-tests.yml` executa:

- PR/push: regressões e Smoke local;
- agenda diária: `external-smoke` público e não bloqueante;
- agenda semanal: Load no SWAPI self-hosted;
- dispatch manual: Smoke ou perfis pesados em target controlado;
- publicação de relatório somente após jobs bloqueantes aprovados.

Para perfis pesados, configure a variável `K6_BASE_URL`. Grafana Cloud é opcional e usa `GRAFANA_PROMETHEUS_URL`, `GRAFANA_USERNAME` e `GRAFANA_API_TOKEN`.

## Estrutura

```text
.github/workflows/  pipeline
lab/                SWAPI self-hosted
scripts/            fixture, laboratório e utilitários da CI
src/config/         ambiente, thresholds e política de target
src/core/           HTTP, logs, métricas e relatórios
src/workloads/      workload SWAPI
tests/              perfis k6
tests/ci/           contratos da pipeline
tests/regression/   regressões
```

## Licença

[MIT](LICENSE)
