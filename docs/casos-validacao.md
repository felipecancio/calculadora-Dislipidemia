# Casos sintéticos para revisão médica

Nenhum caso é de paciente real. Os testes automatizados em `src/clinical/clinical.test.ts` cobrem a maior parte destes cenários. Onde o resultado depende do PREVENT, o número citado é o da implementação conferida com os casos publicados do preventr 0.12.0.

## PREVENT

1. Mulher, 50 anos, PAS 160 mmHg em tratamento, colesterol total 200 mg/dL, HDL-c 45, sem estatina, diabetes, sem tabagismo, TFGe 90. Modelo básico: 9,2% em 10 anos (proporção 0,092).
2. O mesmo perfil no sexo masculino: 10,2% (0,102).
3. O caso 1 com HbA1c 9,2%: modelo com HbA1c, 10,3%.
4. O caso 1 com relação albumina/creatinina 92 mg/g: modelo com albuminúria, 11,1%.
5. HbA1c e albuminúria juntos, sem CEP: modelo completo com privação social ausente, 12,1% na mulher e 12,6% no homem.
6. Idade 29 ou 80, PAS 89 ou 181, colesterol 129 ou 321, HDL-c 19 ou 101, TFGe 14 ou 141: sem percentual.
7. Evento prévio ou obstrução ≥ 50%: PREVENT não se aplica.

## Cortes

8. PREVENT 4,999%: faixa baixa. 5,000%: intermediária. 19,999%: intermediária. 20%: alta. A comparação usa o valor da equação, não a casa decimal da tela.
9. LDL-c 159,9 mg/dL não entra na faixa 160–189. 160 e 189,9 entram como intermediário, se nada for mais alto. 190 é alto.
10. CAC 100 UA não é alto por cálcio. 100,1 é alto. 300 é alto (&gt; 100) e não é muito alto. 300,1 é muito alto.
11. Lp(a) 50 mg/dL é agravante. 50 nmol/L não é. 180 mg/dL não é o ramo de alto risco; 180,1 mg/dL é. 390 nmol/L não é; 390,1 nmol/L é. Não há conversão.

## Agravante

12. Risco calculado baixo, sem agravante: baixo.
13. O mesmo perfil com um ou mais agravantes: intermediário, uma vez só.
14. LDL-c ≥ 190 com vários agravantes: continua alto. O agravante não cria muito alto.

## Eventos

15. Um episódio com SCA, infarto e revascularização há 8 anos, sem duas condições de alto risco: muito alto, não extremo.
16. Um infarto há 8 anos, com diabetes e hipertensão: extremo.
17. Infarto e AVC em episódios diferentes: extremo.
18. Um infarto recente e apenas diabetes: extremo fica pendente, porque dependeria de contar a recência do mesmo episódio como condição. Mínimo: muito alto.

## Diabetes tipo 2

Perfil sem outros EAR: duração 4 anos, CAC 0, albuminúria 8 mg/g, TFGe 96, LDL-c 110.

19. Homem de 49 anos: intermediário. Homem de 50: alto.
20. Mulher de 55 anos: intermediário. Mulher de 56: alto.
21. Homem de 40 anos com hipertensão: alto (um EAR).
22. Homem de 40 anos com hipertensão, tabagismo e história familiar prematura: muito alto (três EAR).
23. Retinopatia avançada: muito alto.
24. TFGe 20: muito alto pela matriz, com ou sem albuminúria.
25. TFGe 44 e albuminúria 10: alto. Albuminúria 30: muito alto.
26. TFGe 95 e albuminúria 8: sem estratificador renal. Albuminúria 30: alto. Albuminúria 300: muito alto.

## Diabetes tipo 1 e idades fora do PREVENT

27. Homem de 49 anos, DM1 há 8 anos, sem EAR e sem EMAR: não vira alto pelo corte de 50 anos. ST1RE indicado e não calculado. Resultado incompleto.
28. 25 anos, sem critério categórico: sem percentual.
29. 82 anos, sem evento: alto, sem percentual do PREVENT.
30. LDL basal 210 mg/dL e LDL atual 80 mg/dL em uso de estatina: alto. O valor tratado não rebaixa.

## Metas

31. Em cada categoria, LDL exatamente no corte não atinge a meta. Um décimo abaixo atinge.
32. Basal 200 e atual 140: redução de 30% atingida no baixo ou intermediário; não atinge os 50% do alto. Atual 100 atinge 50%. Atual 100,1 não atinge.
33. Sem basal: a meta percentual aparece e a redução alcançada não é calculada.

## Tratamento

34. Risco baixo, LDL 120, sem persistência: estilo de vida, sem início automático.
35. Risco baixo ou intermediário, LDL 150, persistência confirmada: iniciar medicamento.
36. LDL basal 200 e atual 60, já em estatina, adesão adequada: categoria alta e manutenção.
37. LDL ainda alto com adesão inadequada: corrigir adesão antes de intensificar.
38. Intolerância completa e LDL ≥ 190: combinação sem estatina habitual.
39. Gestação e LDL ≥ 190: categoria alta permanece; esquema habitual suspenso.
40. Triglicérides 620 persistentes: ramo de fibrato para pancreatite, separado do LDL.
41. Texto livre de outro medicamento, ou itraconazol: não se declara ausência de interação; a estatina específica fica suspensa ou restrita conforme a Tabela 8.2.

## Interface

42. Trocar o LDL de um perfil baixo para 210 mg/dL muda a categoria. “Novo paciente” volta ao formulário vazio.
43. Vírgula e ponto são aceitos nos decimais. Campo vazio não vira zero.
44. O resumo copiável traz a diretriz e, se incompleto, o aviso de que não é classificação definitiva.
