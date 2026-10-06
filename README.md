# Calculadora de Dislipidemia — SBC 2025

Aplicação estática para apoio à decisão na consulta de adultos. Os cálculos rodam no navegador. Não há cadastro, banco, analytics nem envio dos dados.

A diretriz brasileira define categoria, meta e estratégia. A matemática do risco calculado é o PREVENT-ASCVD de 10 anos (Khan et al., 2024). Limiares de tratamento americanos não são usados.

## Executar

```bash
npm install
npm test
npm run dev
```

Abra o endereço mostrado pelo Vite. `npm run build` gera a versão estática em `dist`.

## O que está coberto

- Categorias da Tabela 4.1 e da Figura 4.1, inclusive risco extremo sem contar duas vezes o mesmo episódio.
- Diabetes tipo 2 por idade, EAR, EMAR e matriz renal da Tabela 4.7.
- Metas da Tabela 5.1, com o operador “abaixo de”.
- Estratégia por categoria, adesão, intolerância, gestação, diálise, fígado e interações descritas na diretriz.
- PREVENT-ASCVD de 10 anos, modelos básico, com HbA1c, com albuminúria e completo quando os dois opcionais existem. O índice de privação social não é perguntado nem substituído por CEP.

## Lacuna que impede anunciar uso clínico irrestrito

O Steno Type 1 Risk Engine, indicado na seção 4.6 para DM1 com menos de 20 anos de duração, sem estratificadores e sem risco extremo, **não foi implementado**. Os coeficientes do ST1RE não foram incorporados. Nesse ramo a categoria não é copiada do DM2 e o PREVENT não a substitui. O resultado fica incompleto e aponta a lacuna.

Outras decisões de leitura estão em `docs/regras-clinicas.md`.

## Documentos

- `docs/regras-clinicas.md` — regras, operadores e fontes.
- `docs/casos-validacao.md` — cenários sintéticos para revisão médica.
- `docs/fontes.md` — fontes efetivamente usadas.

Os testes automatizados estão em `src/clinical/clinical.test.ts`. Na última execução local: 18 testes aprovados.
