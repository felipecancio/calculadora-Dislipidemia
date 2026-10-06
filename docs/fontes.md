# Fontes utilizadas

## Diretriz

Rached FH et al. Diretriz Brasileira de Dislipidemias e Prevenção da Aterosclerose – 2025. Arq Bras Cardiol. 2025;122(9):e20250640. DOI: https://doi.org/10.36660/abc.20250640

Arquivo lido: `0066-782X-abc-122-09-e20250640.x98474.pdf`.

Trechos usados na implementação:

- Recomendações resumidas, páginas 19 a 22.
- Seção 4, páginas 40 a 51: Tabelas 4.1 a 4.8, Figuras 4.1 e 4.2, seções 4.2, 4.4.1, 4.6, 4.8 e 4.9.
- Seção 5, Tabela 5.1, página 52.
- Seções 7.1 e 7.13, páginas 59 a 67, inclusive a menção a ácido bempedoico 180 mg/dia e ezetimiba 10 mg com sinvastatina 40 mg.
- Seção 8 e Tabela 8.2, páginas 67 a 76.
- Seções 9.4, 9.5, 9.12.3 e 9.15.

A Tabela 4.7 foi conferida na página 49 do PDF, não só no texto extraído.

## PREVENT

- Khan SS, Matsushita K, Sang Y, et al. Development and Validation of the American Heart Association’s PREVENT Equations. Circulation. 2024;149(6):430-449. DOI: https://doi.org/10.1161/CIRCULATIONAHA.123.067626
- Texto: https://pmc.ncbi.nlm.nih.gov/articles/PMC10910659/
- Calculadora e código da AHA: https://professional.heart.org/en/guidelines-and-statements/prevent-calculator

Os coeficientes numéricos são os das equações de implementação do suplemento (modelos de 10 anos para ASCVD: básico, HbA1c, UACR e completo). A transcrição foi conferida com os vetores do pacote preventr 0.12.0 (Martin Mayer, CRAN), que implementa essas tabelas. Os casos de 0,092 e 0,102 vêm da suíte de testes desse pacote para o paciente de referência (mulher ou homem, 50 anos, PAS 160 mmHg em tratamento, colesterol total 200 mg/dL, HDL-c 45 mg/dL, sem estatina, com diabetes, sem tabagismo, TFGe 90, IMC 35).

Transformações usadas:

- idade: (idade − 55) / 10
- não-HDL-c: mg/dL × 0,02586 − 3,5
- HDL-c: (mg/dL × 0,02586 − 1,3) / 0,3
- PAS &lt; 110: (mín(PAS, 110) − 110) / 20
- PAS ≥ 110: (máx(PAS, 110) − 130) / 20
- TFGe &lt; 60: (mín(TFGe, 60) − 60) / −15
- TFGe ≥ 60: (máx(TFGe, 60) − 90) / −15
- risco = exp(lp) / (1 + exp(lp))

O IMC tem coeficiente zero no PREVENT-ASCVD desses modelos. Não se usa SDI nem CEP. Quando HbA1c e albuminúria estão presentes, o modelo completo entra com o indicador de SDI ausente.

Domínio, sem clampeamento: idade 30–79, PAS 90–180 mmHg, colesterol total 130–320 mg/dL, HDL-c 20–100 mg/dL, TFGe 15–140, HbA1c 4,5–15, UACR 0,1–25000 mg/g.

## Não utilizado como regra terapêutica

Limiares da diretriz americana de colesterol, Pooled Cohort Equations e Framingham não classificam nem tratam. O SCORE2-OP só aparece na frase da seção 4.8 sobre idade ≥ 80 anos.

## Não obtido

Coeficientes validados do Steno Type 1 Risk Engine (https://steno.shinyapps.io/T1RiskEngine/). Por isso o ramo correspondente fica sem percentual.
