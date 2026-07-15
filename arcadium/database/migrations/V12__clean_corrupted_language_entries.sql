-- =============================================================================
-- Arcadium — ACE5
-- Milestone M6 — change request Negozio (filtro Lingua: pulizia dati)
--
-- Dodicesima migrazione versionata (V12): il team usa V10 e V11 per un altro
-- task in corso in parallelo, quindi questa pulizia lingue parte da V12 per
-- non entrare in conflitto di numerazione. Logicamente successiva a V8
-- (vetrina europea); indipendente da V10/V11.
--
-- PROBLEMA
--   Il campo grezzo "supported_languages" del dataset Steam contiene marcatori
--   HTML (es. <strong>*</strong>, per indicare "audio completo") e talvolta
--   BBCode ([b][/b]). Per un sottoinsieme di record il parsing dell'ETL (M3) ha
--   prodotto voci corrotte nella tabella lookup `language`:
--     - entità HTML sfuggite più volte in sequenza (bug di doppia escape),
--       es. "English&amp;amp;amp;amp;lt;strong&amp;amp;amp;amp;gt;...";
--     - residui BBCode letterali, es. "English[b][/b]";
--     - concatenazioni di più lingue senza separatore per via di un formato
--       grezzo anomalo, es. "English Dutch English",
--       "English Russian Spanish - Spain Japanese Czech".
--   Queste voci comparivano nel filtro "Lingua" del Negozio come rumore.
--
-- SOLUZIONE
--   DELETE mirato sulla tabella `language`, con due criteri combinati:
--     1) marcatori di corruzione (HTML/entity/BBCode) — rimozione incondizionata;
--     2) euristica anti-concatenazione — una voce con spazi è tenuta SOLO se è
--        un composto noto ("Simplified Chinese", "Traditional Chinese") oppure
--        segue il pattern "Lingua - Regione" (es. "Spanish - Spain",
--        "Portuguese - Brazil", "Spanish - Latin America"); altrimenti è
--        considerata concatenazione spuria e rimossa.
--   Regola verificata su un campione di 20 valori (14 legittimi conservati,
--   6 corrotti rimossi, zero falsi positivi/negativi) prima di essere applicata.
--
--   Grazie a ON DELETE CASCADE (V1) su game_language.language_id e
--   game_audio_language.language_id, le associazioni delle voci rimosse
--   vengono ripulite automaticamente: nessuna riga orfana, nessun altro impatto
--   sui giochi (che restano, semplicemente senza quella specifica etichetta
--   lingua corrotta).
--
-- NOTE
--   - Non tocca l'ETL (fuori scope: richiederebbe il dataset da ~460MB e un
--     nuovo caricamento). Corregge i dati già presenti nel DB.
--   - Forward-only: non tocca V1-V8 né V10-V11 (task del collega in parallelo).
-- =============================================================================

DELETE FROM language
WHERE
    -- 1) Marcatori di corruzione: entità HTML sfuggite più volte, tag reali,
    --    residui BBCode. Nessuna lingua legittima contiene questi caratteri.
    name ~ '&amp;|<|>|\[b\]|\[/b\]'
    OR
    -- 2) Euristica anti-concatenazione: una voce con spazi è valida solo se è
    --    un composto noto o segue "Lingua - Regione"; altrimenti è scartata.
    NOT (
        name !~ ' '
        OR lower(name) IN ('simplified chinese', 'traditional chinese')
        OR name ~ '^[A-Za-z]+ - [A-Za-z ]+$'
    );
