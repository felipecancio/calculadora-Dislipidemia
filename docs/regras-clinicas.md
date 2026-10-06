# Regras clínicas implementadas

Diretriz: SBC 2025, Arq Bras Cardiol. 2025;122(9):e20250640. Equação: PREVENT-ASCVD de 10 anos, Khan et al., Circulation 2024.

Campo vazio não é zero nem ausência de doença. “Não informado” não é resultado normal.

## 1. Fora de escopo

- Idade &lt; 18 anos: sem categoria, sem percentual e sem esquema. Fonte: escopo desta ferramenta; a diretriz trata infância em outra seção, não reproduzida aqui.

## 2. PREVENT-ASCVD em 10 anos

- Aplica se idade de 30 a 79 anos, inclusive, sem doença cardiovascular estabelecida (evento maior, revascularização ou obstrução ≥ 50%) e com colesterol total, HDL-c, PAS, TFGe, diabetes, tabagismo, anti-hipertensivo e estatina dentro dos limites da seção de fontes.
- Fora do intervalo, o percentual não é calculado e o valor não é empurrado para o limite.
- Modelo básico se não houver HbA1c nem albuminúria. Modelo com HbA1c ou com albuminúria se só um deles existir. Modelo completo, com indicador de privação social ausente, se os dois existirem.
- Faixas, pelo valor não arredondado: &lt; 5% baixo; ≥ 5% e &lt; 20% intermediário; ≥ 20% alto. Fonte: Tabela 4.1.
- O percentual com uma casa pode coincidir com o corte sem mudar a faixa. A tela avisa quando isso ocorre.
- No DM1 em que o ST1RE está indicado, o PREVENT pode ser exibido, mas não classifica.

## 3. Ordem e combinação

A categoria exibida é a mais alta sustentada pelos achados. Um agravante não cria um segundo degrau.

## 4. Risco extremo — Tabela 4.2, p. 41

Evento maior, por episódio: SCA, infarto, AVC isquêmico ou doença arterial periférica sintomática. SCA, infarto e revascularização marcados no mesmo episódio contam como um evento.

Extremo definido:

- dois ou mais episódios maiores distintos; ou
- um episódio maior e pelo menos duas condições de alto risco, sem usar a recência desse mesmo episódio como uma dessas condições.

Condições: idade ≥ 65; HF confirmada; revascularização fora do evento maior; diabetes; hipertensão; TFGe de 15 a 59, inclusive; tabagismo atual; LDL-c ≥ 100 mg/dL com estatina em dose máxima tolerada, ezetimiba e persistência informadas; evento agudo há menos de 2 anos.

Decisão: contar a recência do único episódio também como condição mudaria extremo versus muito alto. A tabela lista as duas linhas, mas não diz se o mesmo fato entra dos dois lados. Quando o extremo só fecharia assim, ou faltaria dado, o resultado fica pendente e o mínimo demonstrado é muito alto.

HF apenas suspeita não conta como condição. TFGe &lt; 15 não entra no intervalo 15–59.

## 5. Muito alto — Tabela 4.1 e Figura 4.1

- Evento aterosclerótico prévio ou revascularização.
- Obstrução arterial ≥ 50%. No valor exatamente 50%, prevalece este operador, e não o “maior que 50%” da Tabela 4.8.
- CAC &gt; 300 UA.
- HF confirmada com CAC &gt; 100 UA (Tabela 4.4).
- DM com EMAR ou com três ou mais EAR.

## 6. Alto

- PREVENT ≥ 20%.
- Placa carotídea ou coronária &lt; 50%, aneurisma de aorta abdominal, ou obstrução informada como &lt; 50%.
- CAC &gt; 100 UA ou percentil &gt; 75. CAC = 100 e CAC = 300 não ultrapassam esses cortes. CAC = 300 ainda é &gt; 100, portanto alto, e não muito alto.
- LDL-c ≥ 190 mg/dL, usando o maior valor entre o atual e o basal quando o basal existe.
- Lp(a) &gt; 180 mg/dL ou &gt; 390 nmol/L. Sem conversão entre unidades. O texto da p. 45 (“acima de”) concorda com o operador &gt;.
- DM2: homem ≥ 50 anos ou mulher ≥ 56 anos sem estratificador; ou qualquer idade com 1 ou 2 EAR e sem EMAR.
- Idade ≥ 80 anos sem doença estabelecida: alto, sem percentual. Fonte: seção 4.8, a partir do SCORE2-OP em região de risco moderado. Não é resultado do PREVENT.

## 7. Intermediário e baixo

- LDL-c ≥ 160 e &lt; 190 mg/dL (a diretriz escreve 160–189 e também “&gt; 160–189”; adotou-se 160 inclusive e 190 exclusivo, porque ≥ 190 já é alto).
- PREVENT de 5% a &lt; 20% sem agravante.
- PREVENT &lt; 5% com pelo menos um agravante da Tabela 4.3: sobe uma vez, para intermediário.
- PREVENT de 5% a &lt; 20% com agravante: sobe uma vez, para alto.
- PREVENT ≥ 20% com agravante: permanece alto.
- Baixo: PREVENT &lt; 5%, sem agravante, sem DM2 e sem categoria superior.
- Dois agravantes não sobem dois degraus.

Agravante presente: história familiar prematura; IMC ≥ 30 ou adiposidade/esteatose/síndrome metabólica; doença inflamatória crônica listada na Tabela 4.3; transplante; fator específico da mulher listado na tabela; Lp(a) ≥ 50 mg/dL ou ≥ 125 nmol/L; PCR-us ≥ 2,0 mg/L.

Abaixo de 30 anos o PREVENT não existe. Agravante sozinho não cria categoria, porque a seção 4.9 não fixa o destino. Fonte: p. 50.

## 8. LDL histórico

Se há tratamento e o basal não foi informado, o LDL atual abaixo de 190 mg/dL não apaga uma possível faixa antiga. A classificação cita essa pendência quando ela ainda pode elevar a categoria.

## 9. Diabetes — Tabelas 4.5 a 4.8

EAR, cada um vale um: DM2 há mais de 10 anos (só DM2); história familiar de coronariopatia prematura; adiposidade, esteatose ou síndrome metabólica; hipertensão; tabagismo; neuropatia autonômica incipiente; retinopatia leve; matriz renal de risco alto; CAC de 10 a 300 UA, inclusive; placa carotídea &lt; 50%; placa coronária &lt; 50%; aneurisma de aorta.

EMAR: três ou mais EAR; DM1 com duração &gt; 20 anos e idade ao diagnóstico &gt; 18 anos; obstrução ≥ 50%; matriz renal de muito alto risco; CT &gt; 310 ou LDL-c &gt; 190 mg/dL; neuropatia autonômica instalada; retinopatia avançada ou em progressão.

DM1 com duração &lt; 20 anos, sem EAR, sem EMAR e sem extremo: ST1RE indicado e não calculado. Não se usa o corte de 50/56 anos do DM2.

DM1 com duração exatamente 20 anos, ou com mais de 20 anos diagnosticado até os 18 anos, sem outro estratificador: a diretriz não fecha a categoria. Resultado pendente.

### Matriz renal, Tabela 4.7, conferida na página

Albumina: &lt; 30; 30–299; ≥ 300 mg/g. TFGe: G1 ≥ 90; G2 60–89; G3a 45–59; G3b 30–44; G4–G5 &lt; 30.

| TFGe | &lt; 30 mg/g | 30–299 | ≥ 300 |
| --- | --- | --- | --- |
| ≥ 90 | sem estratificador renal | alto | muito alto |
| 60–89 | alto | alto | muito alto |
| 45–59 | alto | alto | muito alto |
| 30–44 | alto | muito alto | muito alto |
| &lt; 30 | muito alto | muito alto | muito alto |

Sem albuminúria, G2 a G3b já têm mínimo alto, e macroalbuminúria ainda pode tornar muito alto. G1 sem albuminúria não gera estratificador renal.

## 10. Classificação incompleta

Se um dado ausente ainda pode sustentar categoria mais alta, o estado é incompleto, com o risco mínimo já demonstrado. Exame opcional vazio entra nessa lista quando o corte correspondente superaria a categoria atual. Dados que não mudariam a categoria já atingida não bloqueiam o resultado.

## 11. Metas — Tabela 5.1

| Categoria | LDL-c | Redução | Não-HDL-c | ApoB |
| --- | --- | --- | --- | --- |
| Baixo | &lt; 115 | ≥ 30% | &lt; 145 | &lt; 100 |
| Intermediário | &lt; 100 | ≥ 30% | &lt; 130 | &lt; 90 |
| Alto | &lt; 70 | ≥ 50% | &lt; 100 | &lt; 70 |
| Muito alto | &lt; 50 | ≥ 50% | &lt; 80 | &lt; 55 |
| Extremo | &lt; 40 | ≥ 50% | &lt; 70 | &lt; 45 |

Não-HDL-c = colesterol total − HDL-c. O LDL do exame não é recalculado por Friedewald.

Meta absoluta atingida só se o valor atual for menor que o corte. Redução atingida só se LDL atual ≤ LDL basal × (1 − redução mínima). Sem basal, a meta percentual aparece e a redução alcançada fica sem cálculo. A redução a partir do LDL atual tem outro rótulo.

ApoB é meta secundária e só entra se for informada.

## 12. Tratamento

Estilo de vida em todas as categorias. Fonte: p. 20 e seção 6.

- Baixo ou intermediário: medicamento só se LDL-c ou não-HDL-c estiver persistentemente ≥ 30 mg/dL acima da meta (p. 20). Para baixo risco, isso é LDL-c ≥ 145 ou não-HDL-c ≥ 175.
- Alto: estatina de alta intensidade + ezetimiba (p. 21–22).
- Muito alto: a mesma dupla, com anti-PCSK9 possível para chegar à meta.
- Extremo: estatina de alta intensidade + ezetimiba + anti-PCSK9.
- HF confirmada ou LDL-c ≥ 190: dupla inicial estatina de alta intensidade + ezetimiba, salvo categoria que já exija anti-PCSK9.
- Meta não atingida: revisar adesão, dose máxima tolerada e causa secundária antes de intensificar. Depois, ezetimiba, anti-PCSK9 ou ácido bempedoico.
- Intolerância suspeita não é completa. Parcial: ajustar esquema. Completa confirmada: bempedoico + ezetimiba ou anti-PCSK9, com ou sem ezetimiba.
- Triglicérides persistentemente ≥ 500 mg/dL: fibrato para pancreatite, separado da meta de LDL. Entre 150 e 499, com alto risco ou doença aterosclerótica: icosapenta etila 4 g/dia é citado e não está disponível no Brasil; EPA com DHA não é recomendado para prevenir evento.
- Gestação, intenção de engravidar ou amamentação: sem esquema habitual. Na gestação, manutenção só em risco muito alto e/ou HF, com decisão compartilhada; suspender no primeiro trimestre e reintroduzir no terceiro; pravastatina é a de maior evidência de segurança citada (seção 9.15).
- Child-Pugh C ou hepatopatia ativa sem classe: sem sugestão de estatina. Child A ou B: estatina pode ser usada (seção 9.12.3).
- Hemodiálise: não sugerir início; manter se já houver uso. Diálise peritoneal em risco muito alto ou extremo: introdução pode ser considerada (seção 9.5).
- Hipotireoidismo não corrigido: repor levotiroxina antes de ler a falha do esquema (seção 9.4).
- Insuficiência cardíaca com doença aterosclerótica: não suspender estatina só por isso.

Alta intensidade significa redução média de LDL-c ≥ 50% (seção 7.1). A diretriz consultada não traz uma tabela de miligramas por princípio ativo para escolher a dose só pelo LDL. Doses citadas no texto e usadas como exemplo, não como prescrição automática: ezetimiba 10 mg, ácido bempedoico 180 mg/dia, e os tetos da Tabela 8.2.

Interações reconhecidas: varfarina, anticoagulante oral direto, azólico, inibidor de protease, efavirenz, verapamil, diltiazem, anlodipino, amiodarona, ciclosporina, tacrolimo/everolimo/sirolimo, claritromicina/eritromicina, azitromicina, genfibrozila e fenofibrato. Medicamento fora dessa lista não é declarado “sem interação”; a sugestão específica de estatina é suspensa.

Acompanhamento: perfil lipídico cerca de 4 semanas após início ou ajuste; cerca de um ano depois da meta, salvo má adesão ou efeito adverso (seção 7.1). CK e enzimas hepáticas de rotina sem sintoma não são recomendadas (p. 22).

Nada disso é prescrição. A categoria e a meta continuam visíveis quando uma condição impede o esquema habitual.
