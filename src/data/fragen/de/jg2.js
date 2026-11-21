// Quizfragen 2. Jahrgang (Deutsch, Original). Pro Thema eine Liste; die Position einer Frage ist ihre Adresse
// (Fortschritt, Fehlerheft) und muss in en/hu gleich sein. Die richtige Antwort steht bei correctIndex; in der App
// werden die Antworten immer gemischt. Prüfen: node src/data/tools/check-answers.mjs
export default {
  "unternehmer-firma-firmenbuch": [
    {
      "question": "Welche Voraussetzungen muss laut UGB erfüllt sein, damit jemand als Unternehmer gilt?",
      "options": [
        "Eine auf Dauer angelegte Organisation selbstständiger wirtschaftlicher Tätigkeit, auch ohne jede Gewinnabsicht",
        "Eine im Firmenbuch eingetragene Kapitalgesellschaft mit Gewinnabsicht und mindestens einem Geschäftsführer",
        "Eine natürliche Person, die hauptberuflich unselbstständig beschäftigt ist",
        "Ein Betrieb mit mindestens einem angestellten Mitarbeiter und einem Mindestumsatz von 35.000 EUR"
      ],
      "correctIndex": 0,
      "explanation": "Laut UGB ist Unternehmer, wer eine auf Dauer angelegte Organisation selbstständiger wirtschaftlicher Tätigkeit betreibt - auch wenn diese nicht auf Gewinn ausgerichtet ist."
    },
    {
      "question": "Loopy betreibt ihre Candy Store ganz allein, ohne Gesellschafter. Um welche Art von Unternehmer handelt es sich dabei?",
      "options": [
        "Um eine juristische Person",
        "Um eine Kapitalgesellschaft",
        "Um eine Genossenschaft",
        "Um eine natürliche Person"
      ],
      "correctIndex": 3,
      "explanation": "Da Loopy als Einzelperson selbst Trägerin von Rechten und Pflichten ist, handelt es sich um eine natürliche Person."
    },
    {
      "question": "Welche Aussage zu Freiberuflern (z. B. Ärztinnen, Rechtsanwälten, Architekten) laut UGB trifft zu?",
      "options": [
        "Sie gelten nur als Unternehmer, wenn sie mehr als 700.000 EUR Umsatz in zwei Jahren erzielen",
        "Sie sind von der Unternehmereigenschaft laut UGB ausgeschlossen und dürfen sich nicht eintragen lassen",
        "Sie sind nicht automatisch Unternehmer, können sich aber freiwillig ins Firmenbuch eintragen lassen",
        "Sie müssen sich wie Kapitalgesellschaften verpflichtend ins Firmenbuch eintragen lassen"
      ],
      "correctIndex": 2,
      "explanation": "Freiberufler wie Ärzte, Rechtsanwälte oder Architekten fallen nicht automatisch unter den Unternehmerbegriff des UGB, können sich aber freiwillig ins Firmenbuch eintragen lassen."
    },
    {
      "question": "Was versteht man laut UGB unter der \"Firma\" eines Unternehmens?",
      "options": [
        "Alle Mitarbeiterinnen und Mitarbeiter einschließlich Geschäftsführung und Lehrlingen",
        "Den Namen, unter dem der Unternehmer auftritt und klagen bzw. geklagt werden kann",
        "Den Gesamtwert aller Vermögensgegenstände in der Bilanz des Unternehmens",
        "Das Gebäude, in dem sich der im Firmenbuch eingetragene Sitz des Unternehmens befindet"
      ],
      "correctIndex": 1,
      "explanation": "Die Firma ist laut UGB der Name, unter dem ein Unternehmer im Geschäftsverkehr auftritt, Verträge abschließt und klagen bzw. geklagt werden kann."
    },
    {
      "question": "Woraus setzt sich der Firmenname zusammen?",
      "options": [
        "Aus Firmenwortlaut und Firmenzusatz",
        "Aus Firmenbuchnummer und Firmensitz",
        "Aus Geschäftszweig und Bilanzstichtag",
        "Aus Gesellschaftsvertrag und Musterunterschrift"
      ],
      "correctIndex": 0,
      "explanation": "Der Firmenname besteht aus dem Firmenwortlaut (frei wählbare Bezeichnung) und dem gesetzlich vorgeschriebenen Firmenzusatz, der Hinweise auf die Rechtsform enthält."
    },
    {
      "question": "Was verlangt der Grundsatz der Ausschließlichkeit bei der Wahl eines Firmennamens?",
      "options": [
        "Die Firma darf nur aus dem Vor- und Nachnamen der Inhaberin bzw. des Inhabers bestehen",
        "Die Firma muss den vollständigen Unternehmensgegenstand ausdrücklich im Namen nennen",
        "Die Firma muss zwingend einen Fantasienamen ohne Personennamen enthalten",
        "Die Firma muss sich von den am selben Ort bereits eingetragenen Firmen deutlich unterscheiden"
      ],
      "correctIndex": 3,
      "explanation": "Der Grundsatz der Ausschließlichkeit fordert, dass sich eine Firma von bereits am selben Ort eingetragenen Firmen deutlich unterscheidet, um Verwechslungen zu vermeiden."
    },
    {
      "question": "Loopy möchte ihr Geschäft \"Loopys Bio-Feinkost GmbH\" nennen, verkauft dort aber ausschließlich Süßigkeiten ohne Bio-Zertifizierung. Welches Prinzip der Firmenwahl verletzt sie damit?",
      "options": [
        "Die Kennzeichnungseignung",
        "Die Firmenbuchpflicht",
        "Das Irreführungsverbot",
        "Die Ausschließlichkeit"
      ],
      "correctIndex": 2,
      "explanation": "Der Firmenname darf keine Angaben enthalten, die über geschäftliche Verhältnisse irreführen - der Zusatz \"Bio\" wäre hier täuschend, da keine Bio-Produkte verkauft werden."
    },
    {
      "question": "Wie wird eine Firma bezeichnet, die aus dem Namen der Inhaberin bzw. des Inhabers besteht, z. B. \"Thomas Radler e.U.\"?",
      "options": [
        "Gemischte Firma",
        "Personenfirma",
        "Sachfirma",
        "Fantasiefirma"
      ],
      "correctIndex": 1,
      "explanation": "Eine Personenfirma leitet sich vom Namen einer oder mehrerer im Unternehmen tätiger Personen ab."
    },
    {
      "question": "Ab welcher Umsatzgrenze muss sich ein Einzelunternehmen verpflichtend ins Firmenbuch eintragen lassen?",
      "options": [
        "Über 1 Mio. EUR in einem oder über 700.000 EUR in zwei aufeinanderfolgenden Geschäftsjahren",
        "Über 500.000 EUR in einem oder über 100.000 EUR in zwei aufeinanderfolgenden Geschäftsjahren",
        "Ab dem ersten angestellten Mitarbeiter, unabhängig vom Umsatz",
        "Einzelunternehmen sind niemals zur Eintragung verpflichtet, sie ist stets freiwillig"
      ],
      "correctIndex": 0,
      "explanation": "Einzelunternehmen müssen sich ab einem Umsatz von über 1 Mio. EUR in einem Jahr bzw. über 700.000 EUR in zwei aufeinanderfolgenden Geschäftsjahren verpflichtend ins Firmenbuch eintragen lassen."
    },
    {
      "question": "Woraus besteht das Firmenbuch?",
      "options": [
        "Aus dem Gesellschaftsvertrag und der Satzung",
        "Aus dem Kassabuch und dem Inventurbuch",
        "Aus der Bilanz und der Gewinn- und Verlustrechnung",
        "Aus dem Hauptbuch und der Urkundensammlung"
      ],
      "correctIndex": 3,
      "explanation": "Das Firmenbuch besteht aus dem Hauptbuch mit den wichtigsten Unternehmensdaten und der Urkundensammlung mit zugrundeliegenden Dokumenten wie Gesellschaftsvertrag oder Bilanz."
    }
  ],
  "rechtsformen-unternehmen": [
    {
      "question": "Welches Kriterium gehört laut Lehrbuch NICHT zu den wichtigsten Kriterien für die Wahl der Rechtsform?",
      "options": [
        "Die Lieblingsfarbe der Gründerin bzw. des Gründers",
        "Die Haftung für die Schulden des Unternehmens",
        "Die Kapitalaufbringung (Finanzierung)",
        "Die Leitungsbefugnis und die Kontrolle im Unternehmen"
      ],
      "correctIndex": 0,
      "explanation": "Zu den Kriterien für die Rechtsformwahl zählen u. a. Kapitalaufbringung, Haftung, Leitungsbefugnis/Kontrolle, Art der Buchführung und die steuerliche Belastung - nicht aber persönliche Vorlieben."
    },
    {
      "question": "Welche Aussage zum Einzelunternehmen trifft zu?",
      "options": [
        "Der Einzelunternehmer haftet nur mit dem im Unternehmen eingesetzten Kapital",
        "Ein Einzelunternehmen benötigt immer ein Mindestkapital von 10.000 EUR in bar",
        "Ein Einzelunternehmen muss durch einen Notariatsakt gegründet und eingetragen werden",
        "Der Einzelunternehmer haftet unbeschränkt mit dem gesamten persönlichen Vermögen"
      ],
      "correctIndex": 3,
      "explanation": "Einzelunternehmerinnen und Einzelunternehmer haften voll, persönlich und unbeschränkt mit ihrem gesamten Vermögen - dafür ist die Gründung formlos und ohne Mindestkapital möglich."
    },
    {
      "question": "Wie viele Gesellschafterinnen bzw. Gesellschafter sind für die Gründung einer Offenen Gesellschaft (OG) mindestens erforderlich?",
      "options": [
        "Mindestens 3 Personen",
        "Mindestens 5 Personen",
        "Mindestens 2 Personen",
        "Mindestens 1 Person"
      ],
      "correctIndex": 2,
      "explanation": "Die OG wird von mindestens zwei Personen gegründet, die zu gleichen Rechten und Pflichten am Unternehmen beteiligt sind."
    },
    {
      "question": "Wie haften die Gesellschafter einer OG für die Schulden der Gesellschaft?",
      "options": [
        "Nur anteilig entsprechend ihrer Kapitaleinlage",
        "Persönlich, unbeschränkt, unmittelbar und solidarisch",
        "Nur mit ihrer im Firmenbuch eingetragenen Einlage",
        "Gar nicht, da die OG eine eigene Rechtspersönlichkeit besitzt und allein haftet"
      ],
      "correctIndex": 1,
      "explanation": "Alle Gesellschafter einer OG haften persönlich, unbeschränkt, unmittelbar und solidarisch - Gläubiger können sich also an jeden einzelnen Gesellschafter für die gesamte Schuld wenden."
    },
    {
      "question": "Marius ist Komplementär, Lisa Kommanditistin einer KG. Welche Aussage zur Haftung trifft zu?",
      "options": [
        "Marius haftet unbeschränkt und persönlich, Lisa nur bis zu ihrer eingetragenen Haftsumme",
        "Beide haften in gleichem Ausmaß unbeschränkt und persönlich mit ihrem Privatvermögen",
        "Lisa haftet unbeschränkt und persönlich, Marius nur bis zu seiner Haftsumme",
        "Keiner der beiden haftet persönlich, da die KG eine Kapitalgesellschaft ist"
      ],
      "correctIndex": 0,
      "explanation": "In der KG haftet mindestens ein Komplementär unbeschränkt und persönlich, während der Kommanditist nur beschränkt bis zur Höhe seiner eingetragenen Haftsumme haftet."
    },
    {
      "question": "Welche Aussage zur Gesellschaft bürgerlichen Rechts (GesbR) trifft zu?",
      "options": [
        "Sie muss wie eine OG zwingend ins Firmenbuch eingetragen werden und einen Firmennamen führen",
        "Sie kann bereits von einer einzigen Person ohne Gesellschaftsvertrag gegründet werden",
        "Sie ist eine Form der Kapitalgesellschaft mit eigener Rechtspersönlichkeit",
        "Sie hat keine eigene Rechtspersönlichkeit und wird nicht ins Firmenbuch eingetragen"
      ],
      "correctIndex": 3,
      "explanation": "Die GesbR besitzt keine eigene Rechtspersönlichkeit, tritt nicht unter einem eigenen Firmennamen auf und wird nicht im Firmenbuch eingetragen."
    },
    {
      "question": "Was kennzeichnet die Stille Gesellschaft?",
      "options": [
        "Der stille Gesellschafter haftet wie ein Komplementär unbeschränkt mit seinem Privatvermögen",
        "Die Stille Gesellschaft muss zwingend mit allen Gesellschaftern im Firmenbuch eingetragen werden",
        "Der stille Gesellschafter beteiligt sich nur mit einer Vermögenseinlage und tritt nach außen nicht auf",
        "Der stille Gesellschafter tritt im Namen des Unternehmens nach außen auf und vertritt es gegenüber Kunden"
      ],
      "correctIndex": 2,
      "explanation": "Die Stille Gesellschaft ist eine reine Innengesellschaft - der stille Gesellschafter beteiligt sich nur vermögensmäßig, tritt aber nach außen nicht auf und wird nicht im Firmenbuch eingetragen."
    },
    {
      "question": "Wie hoch ist laut Lehrbuch das Mindeststammkapital für die Gründung einer GmbH?",
      "options": [
        "1.000,00 EUR",
        "10.000,00 EUR",
        "35.000,00 EUR",
        "70.000,00 EUR"
      ],
      "correctIndex": 1,
      "explanation": "Für die Gründung einer GmbH muss ein Mindeststammkapital von 10.000,00 EUR aufgebracht werden."
    },
    {
      "question": "Welche Organe sind bei einer GmbH vorgesehen?",
      "options": [
        "Geschäftsführung, Generalversammlung und (ab bestimmter Größe) Aufsichtsrat",
        "Vorstand, Hauptversammlung und Aufsichtsrat",
        "Nur ein Geschäftsführer, ohne Generalversammlung und Aufsichtsrat",
        "Komplementär und Kommanditisten"
      ],
      "correctIndex": 0,
      "explanation": "Die GmbH wird durch die Geschäftsführung geleitet, die Generalversammlung ist das oberste Organ der Gesellschafter und ab einer bestimmten Größe ist zusätzlich ein Aufsichtsrat vorgesehen."
    },
    {
      "question": "Wie hoch muss das Grundkapital einer Aktiengesellschaft (AG) laut Lehrbuch mindestens sein, und welcher Anteil davon ist sofort bar aufzubringen?",
      "options": [
        "Mindestens 10.000,00 EUR, wovon die Hälfte bar aufzubringen ist",
        "Mindestens 35.000,00 EUR, zur Gänze bar aufzubringen",
        "Mindestens 100.000,00 EUR ohne Barzahlungspflicht",
        "Mindestens 70.000,00 EUR, wovon ein Viertel bar aufzubringen ist"
      ],
      "correctIndex": 3,
      "explanation": "Das Grundkapital einer AG muss mindestens 70.000,00 EUR betragen, wobei mindestens ein Viertel davon bar aufgebracht werden muss."
    },
    {
      "question": "Welche Organe hat eine Aktiengesellschaft?",
      "options": [
        "Nur den Vorstand als alleiniges Organ der Gesellschaft",
        "Prokurist, Kommanditist und Komplementär",
        "Vorstand, Aufsichtsrat und Hauptversammlung",
        "Geschäftsführung, Generalversammlung und Komplementär"
      ],
      "correctIndex": 2,
      "explanation": "Die AG wird vom Vorstand geleitet, vom Aufsichtsrat kontrolliert, und die Aktionäre entscheiden in der Hauptversammlung über zentrale Angelegenheiten."
    },
    {
      "question": "Was ist die Besonderheit der Flexiblen Kapitalgesellschaft (FlexKapG)?",
      "options": [
        "Ihre Gesellschafter haften wie bei einer OG unbeschränkt und persönlich mit dem gesamten Privatvermögen",
        "Sie ermöglicht Unternehmenswert-Anteile (UWA) für Mitarbeitende mit bevorzugter Gewinnbeteiligung",
        "Sie kommt ganz ohne Firmenbucheintragung aus",
        "Sie darf ihre Anteile wie eine AG an der Wiener Börse an beliebige Kleinanleger verkaufen"
      ],
      "correctIndex": 1,
      "explanation": "Die FlexKapG (auch FlexCo) vereint Elemente von GmbH und AG und erlaubt es, Mitarbeiterinnen und Mitarbeiter über Unternehmenswert-Anteile (UWA) am Unternehmen und bevorzugt am Gewinn zu beteiligen."
    },
    {
      "question": "Wer ist bei der GmbH & Co KG typischerweise der Komplementär?",
      "options": [
        "Eine GmbH, sodass keine natürliche Person unbeschränkt haftet",
        "Immer eine natürliche Person, die unbeschränkt mit ihrem Privatvermögen haftet",
        "Der Kommanditist selbst",
        "Eine Genossenschaft"
      ],
      "correctIndex": 0,
      "explanation": "Bei der GmbH & Co KG übernimmt die GmbH als juristische Person die Rolle des unbeschränkt haftenden Komplementärs, wodurch keine natürliche Person persönlich unbeschränkt haftet."
    },
    {
      "question": "Was ist der Hauptzweck einer Genossenschaft laut Lehrbuch?",
      "options": [
        "Ein möglichst hoher Gewinn für externe Anleger",
        "Die Vermeidung jeglicher Firmenbucheintragung und Publizität",
        "Die Beschränkung der Mitgliederzahl auf maximal zwei Personen",
        "Die Förderung des Erwerbs oder der Wirtschaft ihrer Mitglieder"
      ],
      "correctIndex": 3,
      "explanation": "Eine Genossenschaft ist eine Personenvereinigung mit nicht geschlossener Mitgliederzahl, deren Ziel die Förderung des Erwerbs oder der Wirtschaft ihrer Mitglieder durch gemeinsamen Geschäftsbetrieb ist."
    }
  ],
  "vollmachten": [
    {
      "question": "Was versteht man unter der Prokura?",
      "options": [
        "Die umfangreichste Vollmacht, die ein Unternehmen erteilen kann",
        "Eine Vollmacht, die nur für ein einzelnes Geschäft gilt",
        "Eine Vollmacht, die nur mündlich erteilt werden kann",
        "Eine Vollmacht, die nur Filialleitern zusteht"
      ],
      "correctIndex": 0,
      "explanation": "Die Prokura ist die umfangreichste Vollmacht im Unternehmen und ermächtigt zu fast allen gerichtlichen und außergerichtlichen Geschäften."
    },
    {
      "question": "Wer darf laut Lehrbuch eine Prokura erteilen?",
      "options": [
        "Jeder Prokurist kann selbst weitere Prokuristen bestellen",
        "Jede Mitarbeiterin bzw. jeder Mitarbeiter mit Handlungsvollmacht",
        "Ausschließlich das Firmenbuchgericht",
        "Nur der Unternehmer bzw. die Unternehmerin persönlich"
      ],
      "correctIndex": 3,
      "explanation": "Die Prokura darf nur vom Unternehmer bzw. von der Unternehmerin selbst - ausdrücklich und durch Eintragung ins Firmenbuch - erteilt werden."
    },
    {
      "question": "Wofür benötigt ein Prokurist zusätzlich eine ausdrückliche Befugnis, obwohl er Prokura besitzt?",
      "options": [
        "Für die Unterzeichnung von Rechnungen",
        "Für die Entgegennahme von Zahlungen von Kundinnen und Kunden",
        "Für den Verkauf oder die Belastung von Grundstücken",
        "Für den Wareneinkauf im gewöhnlichen Geschäftsbetrieb"
      ],
      "correctIndex": 2,
      "explanation": "Der Verkauf und die Belastung von Grundstücken zählen zu den Geschäften, für die ein Prokurist trotz Prokura eine ausdrückliche zusätzliche Befugnis benötigt."
    },
    {
      "question": "Loopy bestellt zwei Prokuristen und legt fest, dass beide nur gemeinsam handeln dürfen. Um welche Art der Prokura handelt es sich?",
      "options": [
        "Gemischte Prokura",
        "Gesamtprokura",
        "Einzelprokura",
        "Filialprokura"
      ],
      "correctIndex": 1,
      "explanation": "Bei der Gesamtprokura können mehrere Prokuristen nur gemeinsam handeln und Verträge abschließen, keiner allein."
    },
    {
      "question": "Wie unterschreibt ein Prokurist korrekt, wenn er im Namen des Unternehmens handelt?",
      "options": [
        "Mit dem Zusatz \"ppa.\" vor seiner Unterschrift",
        "Mit dem Zusatz \"i. V.\" vor seiner Unterschrift",
        "Ohne jeden Zusatz, nur mit dem eigenen Namen",
        "Mit dem Zusatz \"i. A.\" vor seiner Unterschrift"
      ],
      "correctIndex": 0,
      "explanation": "Prokuristen kennzeichnen ihre Unterschrift mit dem Kürzel \"ppa.\" (per procura), während Handlungsbevollmächtigte je nach Vollmacht \"i. V.\" oder \"i. A.\" verwenden."
    },
    {
      "question": "Wodurch erlischt eine Prokura NICHT?",
      "options": [
        "Durch Widerruf der Prokura durch den Unternehmer",
        "Durch Kündigung seitens des Prokuristen",
        "Durch den Tod oder die Geschäftsunfähigkeit des Prokuristen",
        "Durch eine kurze Krankheit des Prokuristen"
      ],
      "correctIndex": 3,
      "explanation": "Eine Prokura erlischt durch Widerruf, Kündigung, Tod oder Geschäftsunfähigkeit des Prokuristen sowie durch Konkurs des Unternehmens - eine kurzfristige Krankheit ändert daran nichts."
    },
    {
      "question": "Worin unterscheidet sich die Handlungsvollmacht von der Prokura?",
      "options": [
        "Die Handlungsvollmacht ist immer umfangreicher als die Prokura",
        "Die Handlungsvollmacht muss immer ins Firmenbuch eingetragen werden",
        "Die Handlungsvollmacht ist im Umfang eingeschränkter als die Prokura",
        "Die Handlungsvollmacht darf nur vom Firmenbuchgericht erteilt werden"
      ],
      "correctIndex": 2,
      "explanation": "Die Handlungsvollmacht ist - anders als die Prokura - eine eingeschränkte Vollmacht und muss nicht ins Firmenbuch eingetragen werden."
    },
    {
      "question": "Loopy erlaubt ihrer Mitarbeiterin Karin, ausschließlich Süßwaren bei Lieferanten einzukaufen, aber sonst keine weiteren Geschäfte zu tätigen. Um welche Art der Handlungsvollmacht handelt es sich?",
      "options": [
        "Prokura",
        "Artvollmacht",
        "Generalvollmacht",
        "Spezialvollmacht"
      ],
      "correctIndex": 1,
      "explanation": "Die Artvollmacht berechtigt nur zu einer bestimmten Art von Geschäften - hier dem Einkauf von Süßwaren -, während die Generalvollmacht alle gewöhnlichen Geschäfte umfasst und die Spezialvollmacht nur ein einzelnes konkretes Geschäft betrifft."
    }
  ],
  "beschaeftigungsverhaeltnisse": [
    {
      "question": "Welches Merkmal ist typisch für einen \"echten\" Arbeitsvertrag?",
      "options": [
        "Persönliche Abhängigkeit und Weisungsgebundenheit gegenüber dem Arbeitgeber",
        "Völlige Freiheit bei der Wahl von Arbeitszeit und Arbeitsort",
        "Verpflichtung, ein bestimmtes Werk oder einen Erfolg zu schulden",
        "Eigenständige Anmeldung bei der Sozialversicherungsanstalt der Selbstständigen (SVS)"
      ],
      "correctIndex": 0,
      "explanation": "Beim \"echten\" Arbeitsvertrag schuldet der Arbeitnehmer seine persönliche Arbeitskraft und ist an die Weisungen des Arbeitgebers hinsichtlich Arbeitszeit, Arbeitsort und Arbeitsablauf gebunden."
    },
    {
      "question": "Welche Aussage zu Ferienjobs und Pflichtpraktika von HAK-Schülerinnen und -Schülern trifft laut Lehrbuch zu?",
      "options": [
        "Sie sind stets Werkverträge, da ein bestimmtes Ergebnis geschuldet wird",
        "Für sie gelten keinerlei arbeitsrechtlichen Bestimmungen",
        "Sie zählen zu den freien Dienstverträgen",
        "Sie gelten grundsätzlich als \"echte\" Arbeitsverträge"
      ],
      "correctIndex": 3,
      "explanation": "Sowohl im Ferienjob als auch im Pflichtpraktikum arbeiten Schülerinnen und Schüler im Rahmen eines \"echten\" Arbeitsvertrags und unterliegen den entsprechenden gesetzlichen Regelungen."
    },
    {
      "question": "Was gilt für geringfügig Beschäftigte?",
      "options": [
        "Sie müssen sich verpflichtend selbst bei der SVS kranken- und pensionsversichern",
        "Ihr Beschäftigungsverhältnis gilt automatisch als Werkvertrag ohne Arbeitnehmerrechte",
        "Sie verdienen unter der Geringfügigkeitsgrenze und sind nicht automatisch kranken- und pensionsversichert",
        "Sie haben keinen Anspruch auf bezahlten Urlaub und Entgeltfortzahlung bei Krankheit"
      ],
      "correctIndex": 2,
      "explanation": "Geringfügig Beschäftigte verdienen unter der Geringfügigkeitsgrenze; sie haben zwar Anspruch auf bezahlten Urlaub und Entgeltfortzahlung, sind aber - sofern nur bei einem Arbeitgeber beschäftigt - nicht automatisch kranken- und pensionsversichert."
    },
    {
      "question": "Was kennzeichnet einen freien Dienstvertrag im Unterschied zum \"echten\" Arbeitsvertrag?",
      "options": [
        "Der bzw. die freie Dienstnehmerin schuldet wie beim Werkvertrag immer ein fertiges Werk",
        "Der bzw. die freie Dienstnehmerin ist an keine Weisungen zu Arbeitszeit und Arbeitsort gebunden",
        "Der bzw. die freie Dienstnehmerin hat Anspruch auf bezahlten Urlaub wie ein echter Arbeitnehmer",
        "Der bzw. die freie Dienstnehmerin wird nicht vom Auftraggeber bei der ÖGK angemeldet, sondern meldet sich selbst an"
      ],
      "correctIndex": 1,
      "explanation": "Beim freien Dienstvertrag ist der bzw. die Dienstnehmerin nicht an Weisungen bezüglich Arbeitszeit und -ort gebunden, muss aber dennoch vom Auftraggeber bei der ÖGK angemeldet werden und hat keinen Urlaubsanspruch."
    },
    {
      "question": "Was ist das wesentliche Merkmal eines Werkvertrags?",
      "options": [
        "Geschuldet wird ein konkretes Arbeitsergebnis bzw. ein Erfolg, nicht die Arbeitskraft selbst",
        "Der Werkvertragsnehmer ist in die Arbeitsorganisation des Auftraggebers eingegliedert und weisungsgebunden",
        "Der Werkvertragsnehmer erhält verpflichtend bezahlten Urlaub",
        "Der Werkvertragsnehmer wird automatisch bei der ÖGK pflichtversichert"
      ],
      "correctIndex": 0,
      "explanation": "Beim Werkvertrag verpflichtet sich der Werkvertragsnehmer zur Erbringung eines Erfolgs bzw. Werks; das Entgelt wird erst bei Fertigstellung fällig, und er muss sich selbst bei der SVS versichern."
    },
    {
      "question": "Bei welcher der folgenden Beschäftigungsformen besteht KEIN Anspruch auf bezahlten Urlaub?",
      "options": [
        "Beim \"echten\" Arbeitsvertrag",
        "Bei geringfügiger Beschäftigung im Rahmen eines echten Arbeitsvertrags",
        "Beim Ferienjob als \"echter\" Arbeitsvertrag",
        "Beim Werkvertrag"
      ],
      "correctIndex": 3,
      "explanation": "Werkvertragsnehmerinnen und -nehmer sind selbstständig und schulden ein Ergebnis - sie haben daher keinen Anspruch auf bezahlten Urlaub, anders als Arbeitnehmer im \"echten\" Arbeitsverhältnis."
    },
    {
      "question": "Loopy beauftragt eine Grafikerin einmalig damit, ein neues Logo für \"Loopys Candy Store\" zu gestalten; die Grafikerin bestimmt Arbeitszeit und -ort selbst und schuldet das fertige Logo. Um welche Vertragsart handelt es sich am ehesten?",
      "options": [
        "Um einen freien Dienstvertrag",
        "Um ein geringfügiges Beschäftigungsverhältnis",
        "Um einen Werkvertrag",
        "Um einen \"echten\" Arbeitsvertrag"
      ],
      "correctIndex": 2,
      "explanation": "Da die Grafikerin ein konkretes Ergebnis (das fertige Logo) schuldet, frei über Zeit und Ort entscheidet und eigenes Werkzeug verwendet, handelt es sich um einen Werkvertrag."
    }
  ],
  "kaufvertraege-aussenhandel": [
    {
      "question": "Was versteht man unter dem Begriff \"Außenhandel\"?",
      "options": [
        "Den Sammelbegriff für Import und Export zwischen verschiedenen Ländern",
        "Den Austausch von Waren ausschließlich innerhalb eines Landes",
        "Den Handel zwischen zwei Filialen desselben Unternehmens im Inland",
        "Die Lagerung von Waren in einem Zolllager vor der Verzollung"
      ],
      "correctIndex": 0,
      "explanation": "Außenhandel ist der Sammelbegriff für den grenzüberschreitenden Austausch von Gütern und Dienstleistungen, also Import (Einfuhr) und Export (Ausfuhr)."
    },
    {
      "question": "Loopy verkauft eine große Lieferung ihrer Pralinen an einen Händler in Frankreich. Wie nennt man diesen Vorgang aus österreichischer Sicht?",
      "options": [
        "Import",
        "Export",
        "Transithandel",
        "Reexport"
      ],
      "correctIndex": 1,
      "explanation": "Export (Ausfuhr) bezeichnet den Verkauf von Waren oder Dienstleistungen ins Ausland."
    },
    {
      "question": "Loopy kauft Kakaobohnen von einem Lieferanten aus Ecuador für ihre Pralinenproduktion. Wie nennt man diesen Vorgang aus österreichischer Sicht?",
      "options": [
        "Export",
        "Binnenhandel",
        "Import",
        "Veredelungsverkehr"
      ],
      "correctIndex": 2,
      "explanation": "Import (Einfuhr) bezeichnet den Kauf von Waren oder Dienstleistungen aus dem Ausland."
    },
    {
      "question": "Warum ist der Außenhandel für Österreich als kleine, offene Volkswirtschaft besonders wichtig?",
      "options": [
        "Weil Österreich alle benötigten Rohstoffe selbst in ausreichender Menge besitzt",
        "Weil durch den Außenhandel sämtliche Zölle und Steuern für österreichische Unternehmen entfallen",
        "Weil österreichische Unternehmen gesetzlich verpflichtet sind, einen fixen Teil ihrer Produktion zu exportieren",
        "Weil der kleine Binnenmarkt und fehlende Rohstoffe Export und Import für Wohlstand und Arbeitsplätze nötig machen"
      ],
      "correctIndex": 3,
      "explanation": "Da der österreichische Binnenmarkt klein ist und wichtige Rohstoffe fehlen, sind Export und Import zentral für Beschäftigung, Wachstum und Wohlstand; Österreich hat eine hohe Exportquote."
    },
    {
      "question": "Loopy möchte ihre Pralinen erstmals nach Japan exportieren, findet aber schwer heraus, ob dort überhaupt Nachfrage nach ihren Produkten besteht. Welches Risiko der Anbahnungsphase betrifft sie hier?",
      "options": [
        "Marktrisiko",
        "Transportrisiko",
        "Wechselkursrisiko",
        "Annahmerisiko"
      ],
      "correctIndex": 0,
      "explanation": "Das Marktrisiko besteht darin, dass in der Anbahnungsphase unklar ist, ob im Zielland ausreichend Nachfrage besteht bzw. ob man sich gegen die Konkurrenz durchsetzen kann."
    },
    {
      "question": "Nachdem der Exportauftrag fixiert ist, steigen die Zuckerpreise stark an, sodass Loopys Pralinenproduktion teurer wird als kalkuliert. Welches Risiko der Erzeugungsphase trifft hier zu?",
      "options": [
        "Lieferrisiko",
        "Produktionsrisiko",
        "Zahlungsausfallrisiko",
        "Marktrisiko"
      ],
      "correctIndex": 1,
      "explanation": "Das Produktionsrisiko (Erzeugungsphase) besteht darin, dass die tatsächlichen Herstellungskosten höher ausfallen als kalkuliert oder es zu Produktionsausfällen kommt."
    },
    {
      "question": "Ein Container mit Loopys Pralinen wird auf dem Seeweg nach Kanada durch einen Sturm beschädigt. Um welches Risiko handelt es sich?",
      "options": [
        "Annahmerisiko",
        "Zahlungsausfallrisiko",
        "Transportrisiko",
        "Marktrisiko"
      ],
      "correctIndex": 2,
      "explanation": "Das Transportrisiko umfasst Beschädigung, Verlust oder Verzögerung der Ware auf dem Weg zum Käufer und zählt zur Erfüllungsphase des Exportgeschäfts."
    },
    {
      "question": "Der kanadische Kunde verweigert nach ordnungsgemäßer Lieferung die Abnahme von Loopys Pralinen, weil er angeblich die Bestellung storniert hat. Welches Risiko liegt vor?",
      "options": [
        "Wechselkursrisiko",
        "Produktionsrisiko",
        "Transportrisiko",
        "Annahmerisiko"
      ],
      "correctIndex": 3,
      "explanation": "Das Annahmerisiko (Abnahmerisiko) besteht darin, dass der ausländische Käufer die ordnungsgemäß gelieferte Ware nicht abnimmt."
    },
    {
      "question": "Ein ausländischer Kunde nimmt Loopys Pralinen zwar an, gerät danach aber in Zahlungsschwierigkeiten und bezahlt die Rechnung nicht. Wie wird dieses Risiko genannt?",
      "options": [
        "Zahlungsausfallrisiko (Delkredererisiko)",
        "Marktrisiko (Nachfrage- und Konkurrenzrisiko)",
        "Annahmerisiko",
        "Wechselkursrisiko (Währungsrisiko)"
      ],
      "correctIndex": 0,
      "explanation": "Das Zahlungsausfallrisiko, auch Kredit- oder Delkredererisiko genannt, beschreibt die Gefahr, dass der Käufer trotz Lieferung nicht oder nicht vollständig zahlt."
    },
    {
      "question": "Loopy vereinbart mit einem US-Importeur einen Verkaufspreis in US-Dollar. Bis zur tatsächlichen Zahlung fällt der Dollarkurs, sodass Loopy in Euro weniger erhält als erwartet. Welches Risiko ist das?",
      "options": [
        "Zahlungsausfallrisiko",
        "Wechselkursrisiko",
        "Annahmerisiko",
        "Transportrisiko"
      ],
      "correctIndex": 1,
      "explanation": "Das Wechselkursrisiko entsteht, wenn zwischen Vertragsabschluss und Zahlung in Fremdwährung fakturiert wird und sich der Kurs zulasten einer Vertragspartei ändert."
    },
    {
      "question": "Loopy bestellt Kakaobohnen bei einem neuen Lieferanten in Ghana. Sie befürchtet, dass die Ware verspätet, in falscher Menge oder mangelhafter Qualität geliefert werden könnte. Welches typische Risiko des Importeurs beschreibt das?",
      "options": [
        "Marktrisiko",
        "Kreditrisiko",
        "Lieferrisiko",
        "Wechselkursrisiko"
      ],
      "correctIndex": 2,
      "explanation": "Das Lieferrisiko ist das zentrale Risiko des Importeurs: Die bestellte Ware könnte zu spät, in falscher Menge oder Qualität oder gar nicht geliefert werden."
    },
    {
      "question": "Welche Aussage über Incoterms trifft zu?",
      "options": [
        "Incoterms sind gesetzlich zwingende Zollformulare, die bei jeder Ausfuhr aus der EU auszufüllen sind",
        "Incoterms regeln weltweit einheitlich den Gefahrenübergang; in der Gruppe D trägt jedoch der Käufer Kosten und Risiko schon ab dem Werk des Verkäufers",
        "Incoterms gelten nur für Transporte innerhalb der EU und ersetzen dort den Kaufvertrag zwischen den Parteien",
        "Incoterms regeln weltweit einheitlich Kosten- und Gefahrenübergang; in der Gruppe D stellt der Verkäufer die Ware am Bestimmungsort bereit"
      ],
      "correctIndex": 3,
      "explanation": "Incoterms (International Commercial Terms) sind standardisierte Lieferklauseln, die Kosten- und Gefahrenübergang sowie Pflichten regeln (Gruppen E, F, C, D). In der Gruppe D (z. B. DAP, DDP) trägt der Verkäufer Kosten und Risiko bis zum Bestimmungsort."
    },
    {
      "question": "Welches Dokument dient beim Seetransport als Warenbegleitpapier, Transportvertrag UND Traditionspapier (Eigentumsnachweis) zugleich?",
      "options": [
        "Konnossement (Bill of Lading)",
        "Handelsrechnung (Faktura)",
        "Ursprungszeugnis",
        "Internationaler Frachtbrief (CMR)"
      ],
      "correctIndex": 0,
      "explanation": "Das Konnossement (Bill of Lading) ist beim Seetransport das zentrale Dokument: Es dient als Frachtvertrag, Übernahmebestätigung der Ware und Traditionspapier, mit dem das Eigentum an der Ware übertragen werden kann."
    },
    {
      "question": "Worin unterscheidet sich das Dokumentenakkreditiv grundlegend vom Dokumenteninkasso?",
      "options": [
        "Beim Dokumenteninkasso haftet die Bank des Käufers selbst für die Zahlung, beim Dokumentenakkreditiv leitet sie die Dokumente nur weiter",
        "Beim Dokumentenakkreditiv haftet die Bank des Käufers selbst für die Zahlung gegen konforme Dokumente, beim Dokumenteninkasso zieht sie nur treuhändig ein",
        "Beide Verfahren sind inhaltlich identisch und unterscheiden sich nur in der Höhe der Bankgebühren",
        "Das Dokumentenakkreditiv wird ausschließlich im Inlandsgeschäft eingesetzt, das Dokumenteninkasso nur im Außenhandel"
      ],
      "correctIndex": 1,
      "explanation": "Beim Dokumentenakkreditiv verpflichtet sich die Bank des Importeurs selbst zur Zahlung, sobald die vereinbarten Dokumente vorgelegt werden – das bietet dem Exporteur hohe Sicherheit. Beim Dokumenteninkasso leitet die Bank die Dokumente nur weiter und zieht das Geld ein, haftet aber nicht selbst für die Zahlung."
    }
  ],
  "grundlagen-leistungserstellung-2jg": [
    {
      "question": "Welche zwei Produktionsfaktoren benötigt ein Unternehmen laut Buch für die betriebliche Leistungserstellung?",
      "options": [
        "Menschliche Arbeitsleistung und Betriebsvermögen",
        "Natürliche Ressourcen und das Kapital der Eigentümer",
        "Beschaffung und Absatz",
        "Anlagevermögen und Marketingabteilung"
      ],
      "correctIndex": 0,
      "explanation": "Für die Erstellung der betrieblichen Leistungen benötigt ein Unternehmen die Produktionsfaktoren menschliche Arbeitsleistung und Betriebsvermögen, das sich wiederum in Anlage- und Umlaufvermögen gliedert."
    },
    {
      "question": "Wie bezeichnet man eine Leistung, die sowohl ein Sachgut als auch eine zusätzliche Dienstleistung umfasst (z. B. eine Maschine mit Wartungsvertrag)?",
      "options": [
        "Investitionsgut",
        "Hybride Form",
        "Konsumgut",
        "Personenbezogene Dienstleistung"
      ],
      "correctIndex": 1,
      "explanation": "In der Praxis findet man häufig hybride Formen, bei denen Sachgüter mit zusätzlichen Dienstleistungen kombiniert werden – eine Mischform aus Sachgut und Dienstleistung."
    },
    {
      "question": "Welche drei betrieblichen Grundfunktionen hängen laut Buch unmittelbar mit der Leistungserstellung zusammen?",
      "options": [
        "Personal, Finanzen, Controlling",
        "Logistik, Qualitätsmanagement, Rechnungswesen",
        "Beschaffung, Produktion, Absatz",
        "Marketing, Vertrieb, Kundenservice"
      ],
      "correctIndex": 2,
      "explanation": "Die drei betrieblichen Grundfunktionen Beschaffung, Produktion (Leistungserstellung) und Absatz hängen unmittelbar mit der Leistungserstellung zusammen und werden u. a. von Logistik, Personal-, Finanz- und Qualitätsmanagement unterstützt."
    },
    {
      "question": "In Loopys Candy Store stellt eine Verpackungsmaschine 4.000 Bonbons pro Stunde her. Welche Kennzahl wird hier berechnet, wenn man die Produktmenge den eingesetzten Maschinenstunden gegenüberstellt?",
      "options": [
        "Rentabilität",
        "Wirtschaftlichkeit",
        "Flexibilität",
        "Maschinenproduktivität"
      ],
      "correctIndex": 3,
      "explanation": "Die Produktivität stellt den mengenmäßigen Output dem mengenmäßigen Input gegenüber; die Maschinenproduktivität berechnet sich aus Produktmenge geteilt durch eingesetzte Maschinenstunden."
    },
    {
      "question": "Die Wirtschaftlichkeit von Loopys Candy Store liegt bei einem Wert von 0,9. Was bedeutet dieses Ergebnis?",
      "options": [
        "Es wird ein Verlust erwirtschaftet",
        "Es wird ein Gewinn erwirtschaftet",
        "Es wird genau kostendeckend gewirtschaftet",
        "Die Aussage lässt keine Rückschlüsse auf den Erfolg zu"
      ],
      "correctIndex": 0,
      "explanation": "Die Wirtschaftlichkeit stellt den wertmäßigen Output dem wertmäßigen Input gegenüber. Ist der Wert kleiner als 1, wird ein Verlust erwirtschaftet."
    },
    {
      "question": "Loopys Candy Store erzielt einen Gewinn von 50.000 EUR bei einem eingesetzten Eigenkapital von 500.000 EUR. Wie hoch ist die Eigenkapitalrentabilität?",
      "options": [
        "5 %",
        "10 %",
        "50 %",
        "1 %"
      ],
      "correctIndex": 1,
      "explanation": "Die Rentabilität berechnet sich aus Gewinn geteilt durch Kapitaleinsatz mal 100: 50.000 / 500.000 × 100 = 10 %."
    },
    {
      "question": "Welche vier Faktoren bestimmen laut Buch die Kundenzufriedenheit?",
      "options": [
        "Preis, Werbung, Marke, Design",
        "Produktivität, Wirtschaftlichkeit, Rentabilität, Nachhaltigkeit",
        "Qualität, Lieferzeit, Terminreue, Flexibilität",
        "Beschaffung, Produktion, Absatz, Logistik"
      ],
      "correctIndex": 2,
      "explanation": "Die Faktoren der Kundenzufriedenheit sind Qualität, Lieferzeit, Terminreue und Flexibilität."
    },
    {
      "question": "Was gibt die Kennzahl „Terminreue\" an?",
      "options": [
        "Wie lange Kunden im Durchschnitt auf ihre Bestellung warten müssen",
        "Wie groß der Anteil fehlerfreier Güter an der gesamten Herstellmenge ist",
        "Inwieweit ein Unternehmen auf besondere Kundenwünsche eingehen kann",
        "Wie viele der gesamten Lieferungen pünktlich an die Kunden erfolgt sind"
      ],
      "correctIndex": 3,
      "explanation": "Die Terminreue gibt an, wie viele der gesamten Lieferungen pünktlich an die Kunden erfolgt sind, und wird in B2B-Verträgen oft mit einem Pönale bei Lieferverzug abgesichert."
    },
    {
      "question": "Zu welcher Kostenart der Leistungserstellung zählen Miet- und Energiekosten für die Lageranlage?",
      "options": [
        "Lagerkosten",
        "Produktionskosten",
        "Transportkosten",
        "Indirekte Kosten"
      ],
      "correctIndex": 0,
      "explanation": "Lagerkosten setzen sich aus Kosten der Lageranlage (z. B. Miete, Energiekosten), Lagerbeständen (Verderb, Schwund, Kapitalbindung) und Lagerverwaltung (Löhne, Gehälter) zusammen."
    },
    {
      "question": "Welche drei Dimensionen der Nachhaltigkeit werden im Buch unterschieden?",
      "options": [
        "Regionale, nationale und internationale Nachhaltigkeit",
        "Soziale, ökonomische und ökologische Nachhaltigkeit",
        "Finanzielle, rechtliche und organisatorische Nachhaltigkeit",
        "Produktions-, Lager- und Transportnachhaltigkeit"
      ],
      "correctIndex": 1,
      "explanation": "Die drei Dimensionen der Nachhaltigkeit sind die soziale (z. B. faire Entlohnung), die ökonomische (Gewinnerzielung für Investitionen) und die ökologische Nachhaltigkeit (Ressourcenschonung)."
    },
    {
      "question": "Was versteht man im Rahmen der Unternehmensethik unter einem „Code of Conduct\"?",
      "options": [
        "Eine gesetzliche Vorschrift zur Exportkontrolle, die nur für Industrieunternehmen in der EU gilt",
        "Eine Kennzahl zur Beurteilung der Wirtschaftlichkeit von Produktion und Verwaltung",
        "Einen Verhaltenskodex mit Werten und Regeln, an die sich alle im Unternehmen halten müssen",
        "Ein Dokument zur Berechnung der Rentabilität"
      ],
      "correctIndex": 2,
      "explanation": "Werte und Verhaltensregeln der Unternehmensethik können z. B. in einem Code of Conduct festgelegt werden – einem Verhaltenskodex, an den sich alle Personen im Unternehmen zu halten haben."
    }
  ],
  "kunde-im-mittelpunkt": [
    {
      "question": "Was versteht man unter dem Begriff Marketing?",
      "options": [
        "Die möglichst kostengünstige Herstellung von Produkten, unabhängig von der Nachfrage",
        "Die konsequente Ausrichtung des Unternehmens an den Bedürfnissen der Kunden",
        "Die Werbung für bereits fertig entwickelte Produkte",
        "Die Personalverwaltung eines Unternehmens"
      ],
      "correctIndex": 1,
      "explanation": "Marketing bezeichnet die konsequente Ausrichtung aller unternehmerischen Aktivitäten an den Bedürfnissen der Kunden."
    },
    {
      "question": "Welche Phase gehört NICHT zur Customer Journey?",
      "options": [
        "Bewusstwerdung (Awareness)",
        "Überlegung (Consideration)",
        "Produktionsplanung",
        "Nachkaufphase"
      ],
      "correctIndex": 2,
      "explanation": "Die Customer Journey umfasst typischerweise die Phasen Awareness, Consideration, Kauf und Nachkaufphase – nicht die Produktionsplanung."
    },
    {
      "question": "Wodurch unterscheiden sich quantitative von qualitativen Marketingzielen?",
      "options": [
        "Quantitative Ziele sind messbar, qualitative betreffen z. B. Image und Zufriedenheit",
        "Quantitative Ziele betreffen das Image, qualitative den Umsatz und den Marktanteil",
        "Qualitative Ziele sind immer wichtiger, weil sie sich genau in Zahlen ausdrücken lassen",
        "Quantitative Ziele betreffen nur den Personalbereich"
      ],
      "correctIndex": 0,
      "explanation": "Quantitative Ziele sind zahlenmäßig messbar, z. B. Umsatz oder Marktanteil, während qualitative Ziele etwa das Image oder die Kundenzufriedenheit betreffen."
    },
    {
      "question": "Was versteht man unter Marktsegmentierung?",
      "options": [
        "Die Fusion mehrerer Unternehmen zu einem gemeinsamen Marktführer",
        "Die Reduktion der Produktpalette auf die umsatzstärksten Artikel",
        "Die Aufteilung eines Marktes unter Konkurrenten durch Preisabsprachen",
        "Die Aufteilung eines Gesamtmarktes in Gruppen mit ähnlichen Bedürfnissen"
      ],
      "correctIndex": 3,
      "explanation": "Bei der Marktsegmentierung wird ein Gesamtmarkt in homogene Käufergruppen (Segmente) mit ähnlichen Bedürfnissen aufgeteilt."
    },
    {
      "question": "Loopy's Candy Store möchte gezielt nur eine kleine, besonders naschfreudige Zielgruppe (z. B. Fans von Bio-Süßwaren) ansprechen. Welche Marktbearbeitungsstrategie wendet Loopy damit an?",
      "options": [
        "Undifferenziertes Marketing",
        "Differenziertes Marketing",
        "Konzentriertes Marketing",
        "Massenmarketing"
      ],
      "correctIndex": 2,
      "explanation": "Beim konzentrierten Marketing (Nischenmarketing) konzentriert sich ein Unternehmen gezielt auf ein einziges, spezielles Marktsegment."
    },
    {
      "question": "Wie nennt man es, wenn Loopy's Candy Store mehrere unterschiedliche Produktlinien für verschiedene Kundengruppen gleichzeitig anbietet (z. B. zuckerfrei, vegan, klassisch)?",
      "options": [
        "Konzentriertes Marketing",
        "Differenziertes Marketing",
        "Undifferenziertes Marketing",
        "Nischenmarketing"
      ],
      "correctIndex": 1,
      "explanation": "Beim differenzierten Marketing (Mehrsegmentmarketing) werden mehrere Marktsegmente jeweils mit angepassten Marketingmaßnahmen bearbeitet."
    },
    {
      "question": "Was bezeichnet man als USP?",
      "options": [
        "Universal Service Provider (Grundversorgungsanbieter)",
        "User Support Plattform (Kundenservice-Portal)",
        "Umsatz-Steuer-Prozentsatz (Mehrwertsteuersatz)",
        "Unique Selling Proposition (Alleinstellungsmerkmal)"
      ],
      "correctIndex": 3,
      "explanation": "USP steht für Unique Selling Proposition – das einzigartige Verkaufsversprechen, mit dem sich ein Produkt von der Konkurrenz abhebt."
    },
    {
      "question": "Was gehört zu den klassischen Instrumenten des Marketingmix (den \"4 Ps\")?",
      "options": [
        "Produkt, Preis, Distribution, Kommunikation",
        "Personalplanung, Produktion, Preis, Präsentation",
        "Presse, Politik, Programm, Portfolio",
        "Preis, Personal, Prozess, Produkt"
      ],
      "correctIndex": 0,
      "explanation": "Der Marketingmix umfasst Produktpolitik, Preispolitik, Distributionspolitik (Place) und Kommunikationspolitik (Promotion)."
    },
    {
      "question": "Was versteht man unter Kundenorientierung?",
      "options": [
        "Kunden werden bei Entscheidungen ignoriert",
        "Die Ausrichtung aller Entscheidungen ausschließlich am niedrigsten Preis",
        "Die Kunden treffen selbst alle Entscheidungen über die Produktion",
        "Die konsequente Ausrichtung betrieblicher Entscheidungen an Kundenwünschen"
      ],
      "correctIndex": 3,
      "explanation": "Kundenorientierung bedeutet, alle betrieblichen Entscheidungen konsequent an den Wünschen und Bedürfnissen der Kunden auszurichten."
    },
    {
      "question": "Wozu dient ein Positionierungskreuz (Positioning Map)?",
      "options": [
        "Zur Berechnung der Lohnkosten je Abteilung",
        "Zur grafischen Einordnung eines Produkts im Vergleich zu Mitbewerbern",
        "Zur Terminplanung von Projekten auf einer Zeitachse",
        "Zur Darstellung der eigenen Filialstandorte und jener der Konkurrenz auf einer Landkarte"
      ],
      "correctIndex": 1,
      "explanation": "Ein Positionierungskreuz zeigt grafisch, wie ein Produkt im Vergleich zu Mitbewerbern hinsichtlich zweier Merkmale (z. B. Preis und Qualität) wahrgenommen wird."
    }
  ],
  "marktforschung": [
    {
      "question": "Was versteht man unter Marktforschung?",
      "options": [
        "Die systematische Gewinnung, Aufbereitung und Auswertung von Marktinformationen",
        "Die Entwicklung und Herstellung neuer Süßwaren im eigenen Labor",
        "Die systematische Erfassung aller Geschäftsfälle in der Buchhaltung",
        "Die laufende Werbung, um neue Absatzmärkte zu erschließen"
      ],
      "correctIndex": 0,
      "explanation": "Marktforschung ist die systematische Gewinnung, Aufbereitung und Auswertung von Informationen über den Markt."
    },
    {
      "question": "Welches sind die beiden grundlegenden Arten der Marktforschung?",
      "options": [
        "Interne und externe Forschung",
        "Nationale und internationale Marktforschung",
        "Primäre und sekundäre Marktforschung",
        "Digitale und analoge Marktforschung"
      ],
      "correctIndex": 2,
      "explanation": "Man unterscheidet zwischen primärer Marktforschung (Field Research) und sekundärer Marktforschung (Desk Research)."
    },
    {
      "question": "Loopy's Candy Store wertet vorhandene Statistiken der WKO und bestehende Geschäftsberichte aus, um Trends am Süßwarenmarkt zu erkennen. Welche Form der Marktforschung betreibt Loopy damit?",
      "options": [
        "Primärforschung (Field Research)",
        "Experiment",
        "Sekundäre Marktforschung",
        "Feldbeobachtung"
      ],
      "correctIndex": 2,
      "explanation": "Bei der sekundären Marktforschung (Desk Research) werden bereits vorhandene, intern oder extern verfügbare Daten genutzt."
    },
    {
      "question": "Loopy lässt eigens eine neue Umfrage unter seinen Stammkunden zu einer neuen Bonbonsorte durchführen. Um welche Form der Marktforschung handelt es sich?",
      "options": [
        "Sekundäre Marktforschung",
        "Desk Research",
        "Sekundärstatistik",
        "Primäre Marktforschung"
      ],
      "correctIndex": 3,
      "explanation": "Bei der primären Marktforschung (Field Research) werden Daten eigens für einen bestimmten Zweck neu erhoben."
    },
    {
      "question": "Welche drei Methoden zählen zu den klassischen Instrumenten der primären Marktforschung?",
      "options": [
        "Befragung, Beobachtung, Experiment",
        "Bilanz, Buchhaltung, Inventur",
        "Statistikauswertung, Branchenberichte, Geschäftsberichte",
        "Planung, Kontrolle, Organisation"
      ],
      "correctIndex": 0,
      "explanation": "Zu den primären Erhebungsmethoden zählen Befragung, Beobachtung und Experiment."
    },
    {
      "question": "Ein Mitarbeiter von Loopy's Candy Store beobachtet unauffällig, wie Kunden im echten Geschäft vor dem Süßigkeitenregal reagieren. Wie nennt man diese Beobachtungsform?",
      "options": [
        "Laborbeobachtung",
        "Experiment",
        "Sekundärforschung",
        "Feldbeobachtung"
      ],
      "correctIndex": 3,
      "explanation": "Bei der Feldbeobachtung wird das Verhalten in der natürlichen, realen Umgebung beobachtet – im Gegensatz zur Laborbeobachtung unter künstlichen Bedingungen."
    },
    {
      "question": "Loopy testet eine neue, veränderte Rezeptur in einem ausgewählten Testmarkt unter kontrollierten Bedingungen, bevor die Süßigkeit österreichweit eingeführt wird. Welche Methode wendet Loopy damit an?",
      "options": [
        "Experiment (Testmarketing)",
        "Befragung (Interview)",
        "Sekundärforschung (Desk Research)",
        "Beobachtung (Feldbeobachtung)"
      ],
      "correctIndex": 0,
      "explanation": "Beim Experiment (Testmarketing) werden Produkte unter kontrollierten Bedingungen in einem begrenzten Markt getestet, bevor sie flächendeckend eingeführt werden."
    },
    {
      "question": "Was unterscheidet eine offene Frage von einer geschlossenen Frage in einem Fragebogen?",
      "options": [
        "Bei offenen Fragen wird aus vorgegebenen Antworten gewählt, bei geschlossenen frei geantwortet",
        "Bei offenen Fragen wird frei geantwortet, bei geschlossenen aus vorgegebenen Antworten gewählt",
        "Offene Fragen werden nur mündlich gestellt, geschlossene ausschließlich schriftlich im Fragebogen",
        "Geschlossene Fragen sind immer länger"
      ],
      "correctIndex": 1,
      "explanation": "Bei offenen Fragen kann frei geantwortet werden, bei geschlossenen Fragen wird aus vorgegebenen Antwortmöglichkeiten ausgewählt."
    },
    {
      "question": "Welche Befragungsform eignet sich, wenn Loopy schnell und kostengünstig eine größere Anzahl an Kunden zu ihrer Zufriedenheit befragen möchte?",
      "options": [
        "Persönliches Einzelinterview vor Ort",
        "Telefonische Befragung",
        "Schriftliche Online-Befragung",
        "Laborbeobachtung"
      ],
      "correctIndex": 2,
      "explanation": "Die schriftliche Online-Befragung ermöglicht es, viele Personen gleichzeitig, schnell und kostengünstig zu befragen."
    },
    {
      "question": "Wofür steht die Bezeichnung \"Desk Research\"?",
      "options": [
        "Für die primäre Marktforschung durch eigene Befragungen",
        "Für die Beobachtung von Kund:innen im Feld, also die Feldforschung",
        "Für die Durchführung von Experimenten",
        "Für die Auswertung vorhandener Daten, also die sekundäre Marktforschung"
      ],
      "correctIndex": 3,
      "explanation": "Desk Research bezeichnet die Auswertung bereits vorhandener Daten \"am Schreibtisch\" – also die sekundäre Marktforschung."
    }
  ],
  "instrumente-marketings": [
    {
      "question": "Welchem der vier Marketinginstrumente (Marketing-Mix) wird die Festlegung des Verkaufspreises zugeordnet?",
      "options": [
        "Preispolitik (Price)",
        "Produktpolitik (Product)",
        "Distributionspolitik (Place)",
        "Kommunikationspolitik (Promotion)"
      ],
      "correctIndex": 0,
      "explanation": "Der Marketing-Mix besteht aus Produkt-, Preis-, Distributions- und Kommunikationspolitik; die Preisgestaltung fällt in die Preispolitik."
    },
    {
      "question": "Loopy legt bei ihren Süßigkeiten besonderen Wert auf ein hübsches Verpackungsdesign, das ihre Kund:innen zusätzlich begeistert. Wie nennt man diesen ergänzenden Produktnutzen?",
      "options": [
        "Grundnutzen",
        "Zusatznutzen",
        "Deckungsbeitrag",
        "Sortimentstiefe"
      ],
      "correctIndex": 1,
      "explanation": "Der Zusatznutzen ergänzt den Grundnutzen eines Produkts und kann für die Kaufentscheidung ausschlaggebend sein."
    },
    {
      "question": "Ein Supermarkt verkauft Süßigkeiten unter seinem eigenen Label statt unter dem Namen des Herstellers. Wie nennt man diese Markenart?",
      "options": [
        "Gattungsmarke",
        "Herstellermarke (Markenartikel)",
        "Handelsmarke",
        "Dachmarke"
      ],
      "correctIndex": 2,
      "explanation": "Handelsmarken werden vom Handelsunternehmen selbst unter eigenem Namen vertrieben, im Gegensatz zu Herstellermarken."
    },
    {
      "question": "In welcher Reihenfolge durchläuft ein Produkt die Phasen des Produktlebenszyklus?",
      "options": [
        "Wachstum – Einführung – Sättigung – Reife – Rückgang",
        "Reife – Wachstum – Einführung – Rückgang – Sättigung",
        "Sättigung – Rückgang – Einführung – Wachstum – Reife",
        "Einführung – Wachstum – Reife – Sättigung – Rückgang"
      ],
      "correctIndex": 3,
      "explanation": "Der Produktlebenszyklus verläuft von der Einführung über Wachstum und Reife bis zu Sättigung und Rückgang."
    },
    {
      "question": "Ein Produkt hat sowohl einen hohen relativen Marktanteil als auch ein hohes Marktwachstum. Wie wird es in der Portfolioanalyse (Marktwachstums-Marktanteils-Matrix) bezeichnet?",
      "options": [
        "Star",
        "Cash Cow",
        "Poor Dog",
        "Question Mark"
      ],
      "correctIndex": 0,
      "explanation": "Produkte mit hohem Marktanteil und hohem Marktwachstum werden in der BCG-Matrix als \"Stars\" bezeichnet."
    },
    {
      "question": "Welche Produkte werden in der Portfolioanalyse als „Cash Cows\" bezeichnet?",
      "options": [
        "Produkte mit niedrigem Marktanteil und niedrigem Marktwachstum",
        "Produkte mit hohem Marktanteil und niedrigem Marktwachstum",
        "Produkte mit niedrigem Marktanteil und hohem Marktwachstum",
        "Produkte mit hohem Marktanteil und hohem Marktwachstum"
      ],
      "correctIndex": 1,
      "explanation": "Cash Cows haben einen hohen Marktanteil bei nur noch geringem Marktwachstum und liefern stabile Erträge."
    },
    {
      "question": "Loopy nimmt eine schlecht verkaufte Süßigkeit komplett aus ihrem Sortiment. Welches produktpolitische Instrument setzt sie damit ein?",
      "options": [
        "Produktinnovation",
        "Produktvariation",
        "Produktelimination",
        "Produktdifferenzierung"
      ],
      "correctIndex": 2,
      "explanation": "Die Produktelimination bezeichnet das vollständige Entfernen eines Produkts aus dem Sortiment."
    },
    {
      "question": "Loopy bietet neben Bonbons auch Schokolade und Kaugummi an, also mehrere unterschiedliche Produktlinien. Welcher Fachbegriff beschreibt das?",
      "options": [
        "Sortimentstiefe",
        "Produktdifferenzierung",
        "Markenpolitik",
        "Sortimentsbreite"
      ],
      "correctIndex": 3,
      "explanation": "Die Sortimentsbreite gibt die Anzahl unterschiedlicher Produktlinien an, die Sortimentstiefe die Anzahl der Varianten innerhalb einer Produktlinie."
    },
    {
      "question": "Loopy berechnet den Verkaufspreis eines neuen Bonbons, indem sie zu ihren Selbstkosten einen Gewinnaufschlag addiert. Welches Preisfindungsverfahren nutzt sie?",
      "options": [
        "Kostenorientierte Preisbildung",
        "Nachfrageorientierte Preisbildung",
        "Konkurrenzorientierte Preisbildung",
        "Psychologische Preisbildung"
      ],
      "correctIndex": 0,
      "explanation": "Bei der kostenorientierten Preisbildung wird der Preis auf Basis der Selbstkosten plus Gewinnaufschlag ermittelt."
    },
    {
      "question": "Ein Unternehmen setzt beim Marktstart eines neuen Produkts bewusst einen niedrigen Preis an, um schnell viele Kund:innen zu gewinnen. Wie heißt diese Preisstrategie?",
      "options": [
        "Hochpreisstrategie (Skimming)",
        "Niedrigpreisstrategie (Penetration)",
        "Prestigepreisstrategie (Premium Pricing)",
        "Mittelpreisstrategie"
      ],
      "correctIndex": 1,
      "explanation": "Die Niedrigpreisstrategie (Penetrationsstrategie) zielt darauf ab, durch einen niedrigen Einführungspreis schnell Marktanteile zu gewinnen."
    },
    {
      "question": "Loopy verkauft eine Tüte Süßigkeiten um € 2,99 statt € 3,00. Welche psychologische Preisstrategie wendet sie damit an?",
      "options": [
        "Prestigepreis",
        "Dynamic Pricing",
        "Schwellenpreis",
        "Mengenrabatt"
      ],
      "correctIndex": 2,
      "explanation": "Schwellenpreise liegen knapp unter einem runden Betrag und wirken auf Kund:innen psychologisch günstiger."
    },
    {
      "question": "Ein Fluganbieter verändert seine Ticketpreise laufend je nach Nachfrage und Auslastung in Echtzeit. Wie nennt man diese digitale Preisstrategie?",
      "options": [
        "Kostenorientierte Preisbildung",
        "Abschöpfungsstrategie (Skimming)",
        "Personalisierte Preisfindung (Individual Pricing)",
        "Dynamische Preisfindung (Dynamic Pricing)"
      ],
      "correctIndex": 3,
      "explanation": "Beim Dynamic Pricing werden Preise automatisiert und in Echtzeit an Nachfrage und Auslastung angepasst."
    },
    {
      "question": "Welche der folgenden Maßnahmen gehört zur Konditionspolitik?",
      "options": [
        "Die Gewährung eines Mengenrabatts bei größeren Bestellungen",
        "Die Gestaltung einer attraktiven Verpackung",
        "Die Auswahl des passenden Werbeträgers",
        "Die Wahl des Vertriebswegs über den Großhandel"
      ],
      "correctIndex": 0,
      "explanation": "Rabatte wie Mengenrabatte zählen zur Konditionspolitik, die Zahlungs- und Lieferbedingungen regelt."
    },
    {
      "question": "Loopy verkauft ihre Süßigkeiten ausschließlich über ihren eigenen Online-Shop, ganz ohne Zwischenhändler. Welchen Absatzweg nutzt sie damit?",
      "options": [
        "Indirekter Absatzweg",
        "Direkter Absatzweg",
        "Selektiver Absatzweg",
        "Exklusiver Absatzweg"
      ],
      "correctIndex": 1,
      "explanation": "Beim direkten Absatzweg verkauft der Hersteller seine Produkte ohne Zwischenhändler direkt an die Kund:innen."
    },
    {
      "question": "Eine Luxusuhrenmarke verkauft ihre Produkte nur über eine sehr geringe Anzahl streng ausgewählter Fachhändler weltweit. Um welche Vertriebsart handelt es sich?",
      "options": [
        "Intensive Distribution",
        "Selektive Distribution",
        "Exklusive Distribution",
        "Digitale Distribution"
      ],
      "correctIndex": 2,
      "explanation": "Bei der exklusiven Distribution wird nur eine sehr begrenzte Anzahl sorgfältig ausgewählter Händler beliefert."
    },
    {
      "question": "Welches der folgenden Instrumente gehört NICHT zu den klassischen Instrumenten der Kommunikationspolitik?",
      "options": [
        "Werbung",
        "Öffentlichkeitsarbeit (Public Relations)",
        "Verkaufsförderung",
        "Sortimentspolitik"
      ],
      "correctIndex": 3,
      "explanation": "Sortimentspolitik ist Teil der Produktpolitik, nicht der Kommunikationspolitik."
    },
    {
      "question": "Welche drei Bereiche umfasst die Corporate Identity eines Unternehmens typischerweise?",
      "options": [
        "Corporate Design, Corporate Communication, Corporate Behavior",
        "Produktpolitik, Preispolitik, Distributionspolitik",
        "Corporate Design, Corporate Governance, Corporate Finance",
        "Segmentierung, Targeting, Positionierung"
      ],
      "correctIndex": 0,
      "explanation": "Corporate Identity setzt sich aus Corporate Design, Corporate Communication und Corporate Behavior zusammen."
    },
    {
      "question": "Loopy gestaltet eine Werbeanzeige nach der AIDA-Formel. Wofür steht das „D\" in AIDA?",
      "options": [
        "Discount (Rabatt)",
        "Desire (Verlangen)",
        "Distribution (Vertrieb)",
        "Decision (Entscheidung)"
      ],
      "correctIndex": 1,
      "explanation": "AIDA steht für Attention (Aufmerksamkeit), Interest (Interesse), Desire (Verlangen) und Action (Handlung)."
    },
    {
      "question": "Ein Unternehmen schaltet einen TV-Werbespot, der sich mit derselben Botschaft an eine große, undifferenzierte Zielgruppe richtet. Um welche Form der Werbung handelt es sich?",
      "options": [
        "Einzelwerbung",
        "Individualwerbung",
        "Massenwerbung",
        "Below-the-line-Werbung"
      ],
      "correctIndex": 2,
      "explanation": "Massenwerbung richtet sich mit einer einheitlichen Botschaft an ein breites, nicht weiter differenziertes Publikum."
    },
    {
      "question": "Loopy verteilt in ihrem Geschäft kostenlose Süßigkeitenproben, um Kund:innen zum Kauf zu animieren. Welches Kommunikationsinstrument setzt sie damit ein?",
      "options": [
        "Öffentlichkeitsarbeit",
        "Sponsoring",
        "Corporate Identity",
        "Verkaufsförderung"
      ],
      "correctIndex": 3,
      "explanation": "Produktproben sind eine typische Maßnahme der Verkaufsförderung, um Kund:innen kurzfristig zum Kauf anzuregen."
    },
    {
      "question": "Was versteht man unter Sponsoring als Instrument der Kommunikationspolitik?",
      "options": [
        "Die finanzielle oder materielle Unterstützung von Personen oder Organisationen gegen eine Werbeleistung",
        "Die kostenlose Weitergabe von Produktproben an Kund:innen, um sie zum Kauf zu animieren",
        "Die finanzielle Unterstützung von Vereinen aus reiner Großzügigkeit, ohne Gegenleistung",
        "Die Festlegung des Verkaufspreises eines Produkts"
      ],
      "correctIndex": 0,
      "explanation": "Beim Sponsoring unterstützt ein Unternehmen Personen oder Organisationen finanziell oder materiell gegen eine vereinbarte Werbeleistung."
    },
    {
      "question": "Was ist das zentrale Ziel der Öffentlichkeitsarbeit (Public Relations) eines Unternehmens?",
      "options": [
        "Kurzfristig den Absatz durch Rabattaktionen zu steigern",
        "Ein positives Image und Vertrauen in der Öffentlichkeit aufzubauen",
        "Durch bezahlte Werbung rasch neue Kund:innen zu gewinnen",
        "Neue Vertriebswege zu erschließen"
      ],
      "correctIndex": 1,
      "explanation": "Öffentlichkeitsarbeit zielt darauf ab, langfristig Vertrauen und ein positives Image in der Öffentlichkeit aufzubauen."
    }
  ],
  "material-warenwirtschaft": [
    {
      "question": "Was ist die Aufgabe der Material- und Warenwirtschaft?",
      "options": [
        "Ausschließlich den Verkauf der fertigen Produkte zu organisieren",
        "Die für die Leistungserstellung benötigten Güter bereitzustellen",
        "Die Löhne und Gehälter aller Mitarbeiter in der Produktion zu verwalten",
        "Die Werbung und Preisgestaltung für Loopy's Candy Store zu planen"
      ],
      "correctIndex": 1,
      "explanation": "Die Material- und Warenwirtschaft hat die Aufgabe, jene Güter zur Verfügung zu stellen, die ein Unternehmen zur Leistungserstellung benötigt."
    },
    {
      "question": "Damit die Leistungserstellung in Loopy's Candy Store störungsfrei abläuft, müssen die benötigten Güter in der richtigen Qualität, zum richtigen Zeitpunkt, am richtigen Ort und ...",
      "options": [
        "zum günstigsten Preis am Weltmarkt",
        "in der richtigen Menge bereitgestellt werden",
        "nur von einem einzigen Lieferanten stammen",
        "ausschließlich aus dem Ausland importiert werden"
      ],
      "correctIndex": 1,
      "explanation": "Die benötigten Güter müssen in der richtigen Qualität, in der richtigen Menge, zum richtigen Zeitpunkt und am richtigen Ort bereitgestellt werden."
    },
    {
      "question": "Welcher Begriff wird vor allem bei Handelsbetrieben wie Loopy's Candy Store verwendet, wenn es um die Beschaffung der Handelswaren für Kunden geht?",
      "options": [
        "Materialwirtschaft",
        "Produktionswirtschaft",
        "Warenwirtschaft",
        "Finanzwirtschaft"
      ],
      "correctIndex": 2,
      "explanation": "Der Begriff Warenwirtschaft wird v. a. bei Handelsbetrieben verwendet (Beschaffung der Handelswaren für die Kunden), während Materialwirtschaft v. a. bei Produktionsbetrieben verwendet wird (Beschaffung von Roh-, Hilfs- und Betriebsstoffen)."
    },
    {
      "question": "In welche vier Bereiche gliedern sich die Aufgaben der Material- und Warenwirtschaft?",
      "options": [
        "Beschaffung, Lagerung, Verteilung und Entsorgung",
        "Produktion, Marketing, Vertrieb und Personalverwaltung",
        "Einkauf, Verkauf, Buchhaltung und Controlling",
        "Planung, Organisation, Führung und Kontrolle"
      ],
      "correctIndex": 0,
      "explanation": "Die Bereiche der Material- und Warenwirtschaft sind Beschaffung, Lagerung, Verteilung und Entsorgung."
    },
    {
      "question": "Was versteht man unter Supply-Chain-Management im Überblick der Material- und Warenwirtschaft?",
      "options": [
        "Die Verwaltung der Kundenreklamationen",
        "Die Gestaltung der Verkaufsregale und Schaufenster im Süßwarenladen",
        "Wichtige Entscheidungen entlang der gesamten Lieferkette",
        "Die Berechnung der Mitarbeitergehälter"
      ],
      "correctIndex": 2,
      "explanation": "Supply-Chain-Management umfasst wichtige Entscheidungen entlang der gesamten Lieferkette, wie es zum Beispiel im Beispiel des Lebensmittelhändlers Hofer sichtbar wird, der einen Großteil seines Sortiments von regionalen Produzenten bezieht, um lange Transportwege zu vermeiden."
    }
  ],
  "beschaffungsmarketing": [
    {
      "question": "Welche beschaffungspolitische Tätigkeit bildet laut Lehrbuch die Grundlage für den gezielten Einsatz der übrigen beschaffungspolitischen Instrumente?",
      "options": [
        "Beschaffungskommunikationspolitik",
        "Beschaffungsdurchführung",
        "Beschaffungsmarktforschung",
        "Beschaffungskonditionenpolitik"
      ],
      "correctIndex": 2,
      "explanation": "Am Beginn steht die Suche nach geeigneten Lieferanten im Rahmen der Beschaffungsmarktforschung, bevor mithilfe der beschaffungspolitischen Instrumente die eigentlichen Einkaufsentscheidungen getroffen werden."
    },
    {
      "question": "Welche vier Bereiche umfassen laut Lehrbuch die beschaffungspolitischen Instrumente?",
      "options": [
        "Programmpolitik, Konditionenpolitik, Produktionspolitik, Kommunikationspolitik",
        "Marktforschung, Werbepolitik, Distributionspolitik, Servicepolitik",
        "Sortimentspolitik, Preispolitik, Kommunikationspolitik, Verkaufspolitik",
        "Programmpolitik, Methodenpolitik, Konditionenpolitik, Kommunikationspolitik"
      ],
      "correctIndex": 3,
      "explanation": "Die beschaffungspolitischen Instrumente umfassen Beschaffungsprogrammpolitik, Beschaffungsmethodenpolitik, Beschaffungskonditionenpolitik und Beschaffungskommunikationspolitik."
    },
    {
      "question": "Loopy besucht eine Fachmesse, um neue Kakao-Lieferanten für ihre Candy Store kennenzulernen. Um welche Art der Beschaffungsmarktforschung handelt es sich dabei?",
      "options": [
        "Primärforschung, da neue Informationen direkt beschafft werden",
        "Sekundärforschung, da vorhandene Unterlagen ausgewertet werden",
        "Weder Sekundär- noch Primärforschung, sondern Beschaffungsprogrammpolitik",
        "Beschaffungskommunikationspolitik, da mit Lieferanten kommuniziert wird"
      ],
      "correctIndex": 0,
      "explanation": "Der Besuch von Veranstaltungen bzw. Messen zählt zur Primärforschung, bei der neue Informationen direkt beschafft werden – im Gegensatz zur Sekundärforschung, die vorhandene Unterlagen auswertet."
    },
    {
      "question": "Welche der folgenden Quellen zählt laut Lehrbuch zur Sekundärforschung im Rahmen der Beschaffungsmarktforschung?",
      "options": [
        "Die persönliche Befragung von Branchenexperten",
        "Interne Lieferantenkarteien und Lagerstatistiken",
        "Der Besuch einer Fachmesse, um neue Lieferanten kennenzulernen",
        "Eine direkte Anfrage bei einem neuen Lieferanten"
      ],
      "correctIndex": 1,
      "explanation": "Zur Sekundärforschung zählt die Auswertung bereits vorhandener Informationen, z. B. unternehmensinterne Unterlagen wie Lieferantenkarteien oder Lagerstatistiken."
    },
    {
      "question": "Was wird im Rahmen der Beschaffungsprogrammpolitik festgelegt?",
      "options": [
        "Zu welchem Zeitpunkt und bei welchem Lieferanten Güter beschafft werden",
        "Zu welchen Preisen und Zahlungsbedingungen mit den Lieferanten verhandelt wird",
        "Wie die Beziehung zu Lieferanten kommunikativ gepflegt wird",
        "Welche Sachgüter und Dienstleistungen in welcher Menge zu beschaffen sind"
      ],
      "correctIndex": 3,
      "explanation": "Die Beschaffungsprogrammpolitik legt fest, welche Güter (Sachgüter und Dienstleistungen) in welcher Menge zu beschaffen sind – abgestimmt auf das eigene Produktions- bzw. Sortimentsprogramm."
    },
    {
      "question": "Wie wird im ersten Schritt der ABC-Analyse der wertmäßige Jahresbedarf eines Artikels berechnet?",
      "options": [
        "Jahresbedarf in Stück geteilt durch Preis je Stück",
        "Anzahl der Lieferanten multipliziert mit dem Lagerbestand",
        "Jahresbedarf in Stück multipliziert mit Preis je Stück",
        "Durchschnittlicher Lagerbestand multipliziert mit der Anzahl der Bestellungen pro Jahr"
      ],
      "correctIndex": 2,
      "explanation": "Der wertmäßige Jahresbedarf ergibt sich aus dem Jahresbedarf in Mengeneinheiten multipliziert mit dem Preis je Einheit."
    },
    {
      "question": "Wie werden A-, B- und C-Güter im Rahmen der ABC-Analyse laut Lehrbuch anhand des kumulierten Wertanteils üblicherweise abgegrenzt?",
      "options": [
        "A-Güter bis 75 %, B-Güter 75–90 %, C-Güter über 90 %",
        "A-Güter bis 50 %, B-Güter 50–80 %, C-Güter über 80 %",
        "A-Güter bis 90 %, B-Güter 90–95 %, C-Güter über 95 %",
        "A-Güter bis 30 %, B-Güter 30–60 %, C-Güter über 60 %"
      ],
      "correctIndex": 0,
      "explanation": "Die Grenzen werden häufig bei einem kumulierten Wertanteil von 75 % (A-Güter) bzw. 90 % (B-Güter) festgelegt, wobei die genauen Grenzen von Unternehmen zu Unternehmen verschieden sind."
    },
    {
      "question": "Nach wem ist die in der ABC-Analyse verwendete Lorenzkurve benannt?",
      "options": [
        "Nach Konrad Lorenz, dem österreichischen Verhaltensforscher",
        "Nach dem US-Statistiker und Ökonomen Max Otto Lorenz",
        "Nach dem Gründer eines großen deutschen Logistikkonzerns",
        "Nach einer deutschen Wirtschaftsprüfungsgesellschaft"
      ],
      "correctIndex": 1,
      "explanation": "Die Lorenzkurve geht auf Max Otto Lorenz zurück, einen US-amerikanischen Statistiker und Ökonomen."
    },
    {
      "question": "Welche beschaffungspolitische Maßnahme ist laut Lehrbuch für A-Güter typisch?",
      "options": [
        "Kaum Beschaffungsmarktanalysen und hoher Lagerbestand",
        "Seltenes Bestellen großer Mengen, um Bestellkosten zu senken",
        "Vollständiger Verzicht auf Lieferantenanalysen zugunsten von Stammlieferanten",
        "Ausführliche Beschaffungsmarktanalysen und ein niedriger Lagerbestand"
      ],
      "correctIndex": 3,
      "explanation": "A-Güter sind die wichtigsten Güter und erfordern die meiste beschaffungspolitische Aufmerksamkeit: ausführliche Marktanalysen und einen niedrigen Lagerbestand, um die Kapitalbindung gering zu halten."
    },
    {
      "question": "Wie geht ein Unternehmen laut Lehrbuch typischerweise mit C-Gütern um?",
      "options": [
        "Es werden für jeden Artikel aufwendige Beschaffungsmarktanalysen durchgeführt",
        "Es wird ausschließlich just-in-time und ohne Lagerbestand gearbeitet",
        "Es wird selten, aber in großen Mengen bestellt, um Bestellkosten zu sparen",
        "Es werden laufend neue Lieferanten gesucht und Preise verglichen"
      ],
      "correctIndex": 2,
      "explanation": "Bei C-Gütern werden kaum Beschaffungsmarktanalysen durchgeführt; da sie geringe Bedeutung haben, bestellt man selten, aber in größeren Mengen, um die Bestellkosten niedrig zu halten."
    },
    {
      "question": "Wie berechnet sich der Meldebestand?",
      "options": [
        "Sicherheitsbestand geteilt durch Beschaffungszeit",
        "Durchschnittsverbrauch mal Beschaffungszeit plus Sicherheitsbestand",
        "Jahresbedarf geteilt durch Anzahl der Bestellungen",
        "Durchschnittsverbrauch mal Beschaffungszeit minus Sicherheitsbestand"
      ],
      "correctIndex": 1,
      "explanation": "Meldebestand = Durchschnittsverbrauch × Beschaffungszeit + Sicherheitsbestand."
    },
    {
      "question": "Wie funktioniert das Bestellpunktsystem bei der bestandsgesteuerten Bedarfsermittlung?",
      "options": [
        "Bei Erreichen des Meldebestands wird automatisch eine festgelegte Menge bestellt",
        "In festen Zeitabständen wird der Lagerbestand kontrolliert und dann über eine Bestellung entschieden",
        "Es wird nur einmal jährlich zu einem fixen Termin bestellt",
        "Die Bestellung erfolgt ausschließlich nach Kundenauftrag ohne Lagerbestand"
      ],
      "correctIndex": 0,
      "explanation": "Beim Bestellpunktsystem werden Bestellmenge und Meldebestand festgelegt. Wird der Meldebestand erreicht, löst dies automatisch eine Bestellung aus."
    },
    {
      "question": "Was unterscheidet das Bestellrhythmussystem vom Bestellpunktsystem?",
      "options": [
        "Beim Bestellrhythmussystem gibt es kein Kontrollintervall, sondern nur einen Meldebestand",
        "Das Bestellrhythmussystem kommt nur bei A-Gütern mit hohem Wertanteil zum Einsatz",
        "Beim Bestellrhythmussystem entfällt der Meldebestand, es wird immer dieselbe Menge bestellt",
        "Beim Bestellrhythmussystem wird in festen Intervallen geprüft, ob und wie viel bestellt wird"
      ],
      "correctIndex": 3,
      "explanation": "Beim Bestellrhythmussystem werden ein Kontrollintervall und ein Meldebestand festgelegt; bei jeder Kontrolle wird entschieden, ob und wie viel bestellt wird – besonders sinnvoll bei unregelmäßigem Warenbedarf."
    },
    {
      "question": "Was versteht man unter dem Optionalsystem der Bedarfsermittlung?",
      "options": [
        "Ein System, das nur in festen Intervallen kontrolliert und keinen Meldebestand definiert",
        "Ein System, das ausschließlich für C-Güter mit geringem Wertanteil angewendet wird",
        "Ein System, das in Intervallen kontrolliert und auch bei Erreichen des Meldebestands bestellt",
        "Ein System, bei dem jede einzelne Bestellung individuell mit dem Lieferanten verhandelt wird"
      ],
      "correctIndex": 2,
      "explanation": "Das Optionalsystem kombiniert beide Verfahren: Es wird in bestimmten Intervallen kontrolliert und zusätzlich immer dann bestellt, wenn der Meldebestand erreicht wird."
    },
    {
      "question": "Was kennzeichnet ein geschlossenes System (Closed Shop) im E-Procurement?",
      "options": [
        "Zwei Unternehmen sind exklusiv über ihre IT-Systeme miteinander verbunden",
        "Ein großer Händler bietet über ein Portal seine Produkte mehreren Kunden an",
        "Ein unabhängiger Marktplatz stellt eine offene Beschaffungsplattform für viele Anbieter zur Verfügung",
        "Beschaffung erfolgt ausschließlich telefonisch ohne IT-Unterstützung"
      ],
      "correctIndex": 0,
      "explanation": "Bei geschlossenen Systemen sind zwei Unternehmen exklusiv miteinander verbunden. Beim halboffenen System bietet ein großer Händler mehreren Kunden ein Portal, beim offenen System (Katalogsystem) steht eine unabhängige Beschaffungsplattform zur Verfügung."
    },
    {
      "question": "Wie wird das Beschaffungsprinzip bezeichnet, bei dem die Lieferung möglichst unmittelbar vor der Leistungserstellung erfolgt?",
      "options": [
        "Vorratsbeschaffung",
        "Just-in-time-Beschaffung",
        "Einzelbeschaffung",
        "Beschaffungsprogrammpolitik"
      ],
      "correctIndex": 1,
      "explanation": "Wird angestrebt, dass die Lieferung unmittelbar vor der Leistungserstellung erfolgt, spricht man von Just-in-time-Beschaffung – im Gegensatz zur Vorratsbeschaffung (größere Mengen auf Lager) oder Einzelbeschaffung (erst bei konkretem Kundenauftrag)."
    }
  ],
  "lager-transport-entsorgung": [
    {
      "question": "Welche Lagerfunktion liegt vor, wenn Loopy große Mengen an Kakao einkauft, weil sie mit steigenden Preisen rechnet?",
      "options": [
        "Spekulationsfunktion",
        "Sicherungsfunktion",
        "Umformungsfunktion",
        "Warenpräsentationsfunktion"
      ],
      "correctIndex": 0,
      "explanation": "Bei der Spekulationsfunktion werden Waren frühzeitig gekauft, wenn zukünftig steigende Preise erwartet werden."
    },
    {
      "question": "Welche Lagerfunktion beschreibt das Reifen von Holz, Tabak, Whisky oder Käse während der Lagerung?",
      "options": [
        "Sicherungsfunktion",
        "Umformungsfunktion (Reifefunktion)",
        "Ausgleichs- bzw. Überbrückungsfunktion",
        "Entsorgungsfunktion"
      ],
      "correctIndex": 1,
      "explanation": "Die Umformungsfunktion (Reifefunktion) beschreibt, dass bestimmte Güter wie Holz, Tabak, Whisky oder Käse während der Lagerung reifen bzw. sich verändern."
    },
    {
      "question": "In welcher Lagerart werden wetterunempfindliche und diebstahlgefährdete Güter wie Lebensmittel oder Elektroartikel typischerweise gelagert?",
      "options": [
        "Offenes Lager",
        "Geschlossenes Lager",
        "Halboffenes Lager",
        "Freiplatzlager"
      ],
      "correctIndex": 1,
      "explanation": "Im geschlossenen Lager werden wetterempfindliche und diebstahlgefährdete Waren in einem Gebäude gelagert, z. B. Lebensmittel oder Elektroartikel."
    },
    {
      "question": "Welchen Vorteil hat ein zentrales Lager gegenüber mehreren dezentralen Lagern laut Lehrbuchbeispiel von Spar?",
      "options": [
        "Kürzere Transportwege zu den Kunden",
        "Höhere Anpassungsfähigkeit bei regionalen Ausfällen und Lieferengpässen",
        "Höhere Mindestbestände wodurch die Kapitalbindung steigt",
        "Geringere Lager- und Personalkosten, da nur ein Lager nötig ist"
      ],
      "correctIndex": 3,
      "explanation": "Ein zentrales Lager bietet u. a. geringere Lager- und Personalkosten sowie eine effizientere Organisation, hat aber den Nachteil längerer Transportwege zu den Filialen."
    },
    {
      "question": "Wie funktioniert das Freiplatzsystem (chaotisches Lager), wie es im Lehrbuch am Beispiel von Amazon beschrieben wird?",
      "options": [
        "Jede Ware hat einen fest vorgeschriebenen, gleichbleibenden Lagerplatz",
        "Jede Ware wird dort gelagert, wo gerade ein Platz frei ist",
        "Waren werden ausschließlich alphabetisch nach Artikelnamen sortiert gelagert",
        "Es dürfen nur Waren derselben Produktgruppe gemeinsam gelagert werden"
      ],
      "correctIndex": 1,
      "explanation": "Beim Freiplatzsystem wird die Ware dort gelagert, wo gerade Platz frei ist; die Lagerplätze sind beliebig austauschbar, was ein computergestütztes Lagerverwaltungssystem erfordert."
    },
    {
      "question": "Wie berechnet sich die Lagerumschlagshäufigkeit?",
      "options": [
        "Wareneinsatz geteilt durch durchschnittlichen Lagerbestand",
        "Durchschnittlicher Lagerbestand geteilt durch Wareneinsatz",
        "365 geteilt durch Lagerumschlagsdauer",
        "Warenbestand am 1. Jänner geteilt durch Warenbestand am 31. Dezember"
      ],
      "correctIndex": 0,
      "explanation": "Lagerumschlagshäufigkeit = Wareneinsatz / durchschnittlicher Lagerbestand. Sie gibt an, wie oft eine Ware innerhalb eines Jahres durchschnittlich verkauft und ersetzt wurde."
    },
    {
      "question": "Welches Ziel verfolgt die Transportlogistik laut Lehrbuch gegenüber den Kunden?",
      "options": [
        "Minimierung der Versorgungsgeschwindigkeit und -sicherheit",
        "Maximierung der Versorgungsgeschwindigkeit und -sicherheit",
        "Maximierung der Transport- und Lieferzeiten",
        "Minimierung der Anzahl an Lieferanten und Transportpartnern"
      ],
      "correctIndex": 1,
      "explanation": "Ziele der Transportlogistik sind u. a. die Minimierung der Transport- und Lieferzeiten sowie die Maximierung der Versorgungsgeschwindigkeit und -sicherheit gegenüber den Kunden."
    },
    {
      "question": "Was wurde in Österreich mit 1.1.2025 im Rahmen der Entsorgungslogistik für Einweg-Getränkeverpackungen eingeführt?",
      "options": [
        "Ein Verbot von PET-Flaschen und Alu-Dosen",
        "Eine verpflichtende Mehrwegquote von 100 % für alle Getränke im Handel",
        "Eine Abgabe von 25 Cent pro Flasche bzw. Dose, die nicht zurückerstattet wird",
        "Ein Pfand von 25 Cent pro Flasche bzw. Dose, das bei Rückgabe erstattet wird"
      ],
      "correctIndex": 3,
      "explanation": "Seit 1.1.2025 gilt in Österreich ein Pfandsystem: Wer Getränke in PET-Flaschen oder Alu-Dosen kauft, zahlt 25 Cent Pfand, das bei Rückgabe des Leerguts zurückerstattet wird."
    }
  ],
  "supply-chain-management": [
    {
      "question": "Was versteht man laut Lehrbuch unter der Supply Chain (Lieferkette)?",
      "options": [
        "Nur die Transportunternehmen, die Waren zwischen Lieferanten und Endverbrauchern befördern",
        "Alle Unternehmen, die vom Rohstoff bis zum Endverbraucher an einem Produkt beteiligt sind",
        "Ausschließlich die Einkaufs- und Marketingabteilungen eines einzelnen Unternehmens",
        "Die interne Buchhaltung eines Unternehmens"
      ],
      "correctIndex": 1,
      "explanation": "Die Supply Chain (Lieferkette, Wertschöpfungskette) umfasst alle Unternehmen, die an der Erzeugung eines Produktes beteiligt sind – von der Rohstoffgewinnung bis zum Endverbraucher."
    },
    {
      "question": "Was bezeichnet man als Supply-Chain-Management (SCM)?",
      "options": [
        "Die Planung des optimalen Material- und Informationsflusses auf allen Stufen der Lieferkette",
        "Die alleinige Verantwortung eines einzelnen Unternehmens für seine eigene Produktion, Lagerhaltung und Transporte",
        "Die Kontrolle der Mitarbeiterzufriedenheit auf allen Stufen der Lieferkette",
        "Ausschließlich die Auswahl des günstigsten Rohstofflieferanten"
      ],
      "correctIndex": 0,
      "explanation": "Die Planung des optimalen Material- und Informationsflusses auf allen Stufen der Lieferkette bezeichnet man als Supply-Chain-Management (SCM)."
    },
    {
      "question": "Welche Chance bietet laut Lehrbuch ein wirksames Supply-Chain-Management für Unternehmen?",
      "options": [
        "Eine höhere Abhängigkeit von einzelnen Lieferanten und Transportwegen",
        "Ein höherer Zeitaufwand durch mehr Komplexität",
        "Eine geringere Kapitalbindung durch geringere Lagerbestände",
        "Ein höheres Risiko für Imageschäden"
      ],
      "correctIndex": 2,
      "explanation": "Zu den Chancen zählen u. a. eine erhöhte Kundenzufriedenheit, geringere Kapitalbindung durch geringere Lagerbestände und eine verringerte Durchlaufzeit."
    },
    {
      "question": "Welches Risiko des Supply-Chain-Managements zeigt das Lehrbuchbeispiel des Spielwarenherstellers Mattel?",
      "options": [
        "Zu hohe Lagerbestände durch die Zusammenarbeit mit zu vielen Lieferanten",
        "Zu geringe Kapitalbindung durch zu niedrige Lagerbestände",
        "Ein zu kleines Sortiment an Spielzeugen für ältere Kinder",
        "Imageschaden durch bleihaltige Farbe eines Sublieferanten"
      ],
      "correctIndex": 3,
      "explanation": "Bei Mattel wurde in einem in China produzierten Spielzeug bleihaltige Farbe eines Sublieferanten gefunden – ein Beispiel dafür, dass Fehler entlang der Lieferkette zu Imageschäden führen können."
    },
    {
      "question": "Was versteht man unter einer \"resilienten\" Supply Chain?",
      "options": [
        "Eine Lieferkette, die möglichst wenige Lieferanten hat, um Kosten zu sparen",
        "Eine Lieferkette, die gegen unvorhersehbare Krisen widerstandsfähig ist",
        "Eine Lieferkette, die ausschließlich auf Just-in-time ohne Lagerbestände setzt",
        "Eine Lieferkette ohne jegliche Pufferbestände"
      ],
      "correctIndex": 1,
      "explanation": "Resiliente Supply Chains sind gegenüber unvorhersehbaren Ereignissen (z. B. Krieg, Pandemie, Wirtschaftskrise) widerstandsfähig, sodass Störungen abgefedert bzw. überwunden werden können."
    },
    {
      "question": "Welche Maßnahme für ein erfolgreiches SCM setzt Apple laut Lehrbuchbeispiel um, indem ein Teil der iPhone-Produktion von China nach Indien verlagert wird?",
      "options": [
        "Kooperation mit dem bestehenden Hauptlieferanten optimieren",
        "Höhere Pufferbestände in den Lagern einplanen",
        "Sich stärker an den Kunden in Indien orientieren",
        "Auf mehrere Lieferanten setzen (Multi-sourcing)"
      ],
      "correctIndex": 3,
      "explanation": "Durch Multi-sourcing – etwa die teilweise Verlagerung der iPhone-Produktion von China nach Indien – erhöht Apple die Widerstandsfähigkeit seiner Lieferkette gegenüber Störungen an einem einzelnen Standort."
    }
  ],
  "logistik": [
    {
      "question": "Was umfasst der Begriff Logistik laut Lehrbuch?",
      "options": [
        "Nur den reinen Straßentransport von Waren zwischen Lieferant und Kunde",
        "Ausschließlich die Lagerhaltung und Kommissionierung eines Unternehmens",
        "Die Planung, Steuerung und Kontrolle aller Zahlungs- und Geldflüsse eines Unternehmens",
        "Die Planung, Steuerung, Durchführung und Kontrolle aller Güter- und Informationsflüsse"
      ],
      "correctIndex": 3,
      "explanation": "Die Logistik umfasst die ganzheitliche Planung, Steuerung, Durchführung und Kontrolle aller Güter- und Informationsflüsse. Sie ist ein Teil der Supply Chain."
    },
    {
      "question": "Welche vier Arten von Logistikbetrieben werden laut Lehrbuch unterschieden?",
      "options": [
        "Spediteur, Frachtführer, Lager- und Umschlagsbetriebe, Zustelldienst",
        "Spediteur, Hersteller, Groß- und Einzelhandelsbetriebe, Zustelldienst",
        "Straßen-, Schienen-, Wasser- und Luftverkehr",
        "Einkauf, Produktion, Vertrieb, Marketing"
      ],
      "correctIndex": 0,
      "explanation": "Als Logistikbetriebe werden u. a. Spediteur (Transportorganisation), Frachtführer (Transportbetrieb), Lager- und Umschlagsbetriebe sowie Zustelldienste unterschieden."
    },
    {
      "question": "Was macht ein Spediteur laut Lehrbuch?",
      "options": [
        "Er führt den Transport immer selbst mit eigenen Lkw und Fahrern durch",
        "Er organisiert Transporte im eigenen Namen und beauftragt Frachtführer damit",
        "Er verkauft ausschließlich Transportversicherungen an Versender",
        "Er ist ausschließlich für die Zollabfertigung an den EU-Außengrenzen zuständig"
      ],
      "correctIndex": 1,
      "explanation": "Spediteure organisieren im eigenen Namen Transporte und alle dazugehörigen Dienstleistungen; sie beauftragen dafür Frachtführer (Transportbetriebe), die den Transport tatsächlich durchführen."
    },
    {
      "question": "Wodurch unterscheidet sich der Frachtführer vom Spediteur?",
      "options": [
        "Der Frachtführer organisiert nur die Route, ohne selbst zu transportieren",
        "Der Frachtführer ist immer identisch mit dem beauftragenden Spediteur",
        "Der Frachtführer führt den tatsächlichen Transport für andere Unternehmen selbst durch",
        "Der Frachtführer ist ausschließlich für Zollformalitäten und Transportversicherung zuständig"
      ],
      "correctIndex": 2,
      "explanation": "Frachtführer führen den tatsächlichen Transport im Straßen-, Schienen-, Leitungs-, Schiffs- und Luftverkehr für andere Unternehmen durch, während der Spediteur den Transport organisiert."
    },
    {
      "question": "Welches Recht erlaubt es dem Spediteur, einen Transport selbst durchzuführen und dabei die Rechte und Pflichten eines Frachtführers zu übernehmen?",
      "options": [
        "Pfandrecht",
        "Speditionsprovision",
        "Sorgfaltspflicht",
        "Selbsteintrittsrecht"
      ],
      "correctIndex": 3,
      "explanation": "Durch das Selbsteintrittsrecht kann der Spediteur Transporte auch selbst organisieren und durchführen, wodurch er die Rechte und Pflichten eines Frachtführers übernimmt."
    },
    {
      "question": "Welcher Nachteil wird dem Straßengüterverkehr laut Lehrbuch-Übersicht zugeschrieben?",
      "options": [
        "Lieferverzögerungen durch Staus und Unfälle",
        "Geringe Ladekapazität",
        "Bindung an ein festes Schienennetz",
        "Hohe Schadensanfälligkeit durch Piraterie auf hoher See"
      ],
      "correctIndex": 0,
      "explanation": "Zu den Nachteilen des Straßengüterverkehrs zählen u. a. ein schadstoffreiches Transportmittel, Sonn- und Feiertagsfahrverbote sowie Lieferverzögerungen durch Staus und Unfälle."
    },
    {
      "question": "Wodurch unterscheidet sich der Frachtführer im Aufgabenbereich vom Spediteur?",
      "options": [
        "Er organisiert im eigenen Namen Transporte und beauftragt andere Unternehmen",
        "Er führt den tatsächlichen Transport durch, etwa per Lkw, Bahn oder Schiff",
        "Er ist ausschließlich für Zollformalitäten an den Grenzen zuständig",
        "Er übernimmt ausschließlich Lagerhaltung, Kommissionierung und Verpackung"
      ],
      "correctIndex": 1,
      "explanation": "Der Frachtführer ist zuständig für den tatsächlichen Transport im Straßen-, Schienen-, Leitungs-, Schiffs- und Luftverkehr, während der Spediteur diesen Transport im eigenen Namen organisiert und beauftragt."
    },
    {
      "question": "Für welche Güter eignet sich der Schienengüterverkehr laut Lehrbuch besonders?",
      "options": [
        "Leichte, verderbliche Ware wie Blumen oder frische Meeresfrüchte",
        "Termindringende Kleinsendungen",
        "Schüttgüter wie Kies oder Sand sowie Gefahrgut",
        "Ausschließlich hochwertige Waren"
      ],
      "correctIndex": 2,
      "explanation": "Der Schienengüterverkehr eignet sich für alle Stück- und Massengüter, Schüttgüter (z. B. Kies, Sand) sowie Gefahrgut wie chemische Produkte."
    },
    {
      "question": "Welche Eigenschaft trifft laut Lehrbuch auf den Luftfrachtverkehr zu?",
      "options": [
        "Er ist das kostengünstigste, aber auch langsamste Transportmittel",
        "Er benötigt keine Umladevorgänge",
        "Er ist das schnellste, aber teuerste Transportmittel",
        "Er ist nur für Massengüter im Überseebereich geeignet"
      ],
      "correctIndex": 2,
      "explanation": "Der Luftfrachtverkehr ist das schnellste Transportmittel mit hoher Netzdichte, aber gleichzeitig das teuerste mit geringer Ladekapazität – geeignet für leichte, verderbliche oder hochwertige Waren."
    },
    {
      "question": "Worin unterscheiden sich Frachtbriefe von Traditionspapieren?",
      "options": [
        "Frachtbriefe belegen den Versand, Traditionspapiere verbriefen das Recht an der Ware",
        "Frachtbriefe werden nur in der Seeschifffahrt verwendet, Traditionspapiere nur im Straßenverkehr",
        "Beide Begriffe bezeichnen exakt dasselbe Dokument",
        "Traditionspapiere sind nur Begleitpapiere wie Packlisten oder Lieferscheine"
      ],
      "correctIndex": 0,
      "explanation": "Frachtbriefe sind Dokumente, die als Nachweis dienen, dass die Ware versendet wurde. Traditionspapiere (z. B. Seekonnossement) haben eine Wertpapierfunktion und verbriefen das Recht an der Ware."
    },
    {
      "question": "Wie haben sich laut Lehrbuch die CO2-Emissionen im österreichischen Straßengüterverkehr zwischen 1990 und 2019 trotz technischer Verbesserungen entwickelt?",
      "options": [
        "Sie sind dank deutlich effizienterer Motoren um mehr als die Hälfte gesunken",
        "Sie haben sich mehr als verdoppelt, da die Fahrleistung stark zunahm",
        "Sie sind trotz steigender Fahrleistung exakt gleich geblieben",
        "Sie wurden durch Elektro-Lkw vollständig auf null reduziert"
      ],
      "correctIndex": 1,
      "explanation": "Die CO2-Emissionen im österreichischen Straßengüterverkehr stiegen zwischen 1990 (4,1 Mio. Tonnen) und 2019 (8,8 Mio. Tonnen) um mehr als das Doppelte – die Einsparungen pro Kilometer wurden durch die gestiegene Fahrleistung überkompensiert."
    }
  ],
  "der-handel": [
    {
      "question": "Was unterscheidet den Einzelhandel grundsätzlich vom Großhandel?",
      "options": [
        "Der Großhandel verkauft ausschließlich an Privatpersonen und Endkunden",
        "Der Einzelhandel bearbeitet die Produkte wesentlich weiter, bevor er sie an Kunden verkauft",
        "Der Einzelhandel verkauft an Letztverbraucher, der Großhandel an andere Unternehmen",
        "Der Großhandel handelt ausschließlich mit Unternehmen im Ausland"
      ],
      "correctIndex": 2,
      "explanation": "Der Einzelhandel verkauft Produkte vor allem an Letztverbraucher (Konsumenten), während der Großhandel überwiegend an andere Unternehmen wie Einzelhändler oder Produktionsbetriebe liefert."
    },
    {
      "question": "Wodurch zeichnen sich Handelsbetriebe grundsätzlich aus?",
      "options": [
        "Sie stellen die verkauften Produkte selbst her und verkaufen sie direkt an Kunden",
        "Sie bieten ausschließlich Dienstleistungen wie Beratung an",
        "Sie verarbeiten eingekaufte Rohstoffe zu fertigen Produkten weiter",
        "Sie kaufen Produkte ein und verkaufen sie ohne wesentliche Bearbeitung weiter"
      ],
      "correctIndex": 3,
      "explanation": "Handelsbetriebe kaufen Produkte von Herstellern und verkaufen sie weiter, ohne sie wesentlich zu bearbeiten oder zu verarbeiten."
    },
    {
      "question": "Worin liegt der Hauptunterschied zwischen Multi-Channel- und Omni-Channel-Lösungen im Handel?",
      "options": [
        "Multi-Channel bezeichnet ausschließlich den stationären Handel ohne Onlineshop",
        "Bei Multi-Channel sind alle Kanäle technisch miteinander vernetzt, bei Omni-Channel bestehen sie nebeneinander",
        "Es gibt keinen inhaltlichen Unterschied zwischen den beiden Begriffen",
        "Bei Omni-Channel sind alle Kanäle vernetzt, bei Multi-Channel bestehen sie unabhängig nebeneinander"
      ],
      "correctIndex": 3,
      "explanation": "Omni-Channel vernetzt alle Absatzkanäle eines Unternehmens zu einem einheitlichen Kundenerlebnis, während bei Multi-Channel die Kanäle unabhängig nebeneinander bestehen."
    },
    {
      "question": "Welche Aussage zur Bedeutung des Handels in Österreich trifft laut Lehrbuch zu?",
      "options": [
        "Der Handel ist laut WKÖ der zweitgrößte Arbeitgeber Österreichs",
        "Weniger als 5 % der österreichischen Unternehmen sind im Handelssektor tätig",
        "Der Handel hat kaum Einfluss auf das Bild von Städten und Regionen",
        "Nur eine kleine Minderheit der Beschäftigten arbeitet im Handel"
      ],
      "correctIndex": 0,
      "explanation": "Der Handel ist nach Angaben der WKÖ der zweitgrößte Arbeitgeber Österreichs, etwa ein Viertel aller unselbstständig Beschäftigten arbeitet im Handel."
    },
    {
      "question": "Loopy lässt ihre selbst hergestellten Karamellbonbons von der Produktionsstätte in ihren Candy Store in der Innenstadt liefern. Welche Funktion des Handels beschreibt dieser Transport am besten?",
      "options": [
        "Zeitliche Überbrückung (Lagerung)",
        "Räumliche Überbrückung (Organisation des Transports)",
        "Quantitativer Ausgleich (Sammel- und Verteilungsfunktion)",
        "Qualitativer Ausgleich (Sortimentsbildung)"
      ],
      "correctIndex": 1,
      "explanation": "Die räumliche Überbrückungsfunktion sorgt dafür, dass Produkte vom Ort der Produktion zum Ort des Verkaufs gelangen."
    },
    {
      "question": "Ein Händler kauft im Juni große Mengen Christbaumschmuck ein und lagert diesen bis Oktober, um ihn dann zu verkaufen. Welche Handelsfunktion trifft hier zu?",
      "options": [
        "Räumliche Überbrückung (Organisation des Transports)",
        "Qualitativer Ausgleich (Sortimentsbildung)",
        "Zeitliche Überbrückung (Lagerung)",
        "Informationsfunktion"
      ],
      "correctIndex": 2,
      "explanation": "Durch die Lagerung übernimmt der Handel die zeitliche Überbrückung zwischen Produktion und Bedarf der Kundschaft."
    },
    {
      "question": "Loopy kauft bei einem Großhändler eine große Menge Schokolade ein und verkauft sie anschließend einzeln oder in kleinen Tüten an ihre Kundschaft. Welche Handelsfunktion erfüllt sie damit?",
      "options": [
        "Quantitativer Ausgleich (Verteilungsfunktion)",
        "Räumliche Überbrückung (Organisation des Transports)",
        "Zeitliche Überbrückung (Lagerung)",
        "Kommunikationsfunktion"
      ],
      "correctIndex": 0,
      "explanation": "Der Handel kauft große Mengen und verteilt sie in kleinen, bedarfsgerechten Mengen an Kunden weiter – das ist die quantitative Ausgleichsfunktion (Sammel- und Verteilungsfunktion)."
    },
    {
      "question": "Welche Handelsfunktion beschreibt, dass ein Handelsbetrieb ein bedarfsgerechtes Sortiment zusammenstellt und bei Qualitätsmängeln gegenüber den Kunden haftet?",
      "options": [
        "Räumliche Überbrückung (Organisation des Transports)",
        "Zeitliche Überbrückung (Lagerung)",
        "Quantitativer Ausgleich (Sammel- und Verteilungsfunktion)",
        "Qualitativer Ausgleich (Sortimentsbildung)"
      ],
      "correctIndex": 3,
      "explanation": "Der qualitative Ausgleich (Sortimentsbildung) bedeutet, dass der Handel die Qualität der Produkte prüft und im Mängelfall für Umtausch oder Reparatur verantwortlich ist."
    },
    {
      "question": "Welche Betriebsform des Einzelhandels bietet auf großer Verkaufsfläche ein im Vergleich zum Supermarkt schmäleres, aber tieferes Sortiment überwiegend in Selbstbedienung zu niedrigen bis durchschnittlichen Preisen an?",
      "options": [
        "Fach- und Spezialgeschäft",
        "Fachmarkt",
        "Warenhaus",
        "Convenience-Store"
      ],
      "correctIndex": 1,
      "explanation": "Fachmärkte konzentrieren sich auf ein spezialisiertes Sortiment mit großer Auswahl innerhalb einer Warengruppe, meist in Selbstbedienung."
    },
    {
      "question": "Loopy mietet für zwei Wochen ein leerstehendes Ladenlokal, um dort ihre neue Weihnachtspralinen-Linie vorzustellen und per Mundpropaganda Aufmerksamkeit zu erzeugen. Um welche Betriebsform handelt es sich?",
      "options": [
        "Factory-Outlet-Center",
        "Franchisebetrieb",
        "Pop-up-Store",
        "Fachmarkt"
      ],
      "correctIndex": 2,
      "explanation": "Ein Pop-up-Store ist ein zeitlich begrenztes Geschäft in leerstehenden Räumlichkeiten, das durch sein plötzliches Auftauchen für Gesprächsstoff sorgen soll."
    },
    {
      "question": "Was ist typisch für einen Convenience-Store?",
      "options": [
        "Kleinflächiges Geschäft mit begrenztem Sortiment und langen Öffnungszeiten",
        "Großflächiges Geschäft mit sehr breitem Sortiment und dauerhaft niedrigen Preisen",
        "Ein Geschäft, das ausschließlich online und ohne Verkaufsraum verkauft",
        "Ein Handelsbetrieb, der nur Markenüberschüsse zu reduzierten Preisen verkauft"
      ],
      "correctIndex": 0,
      "explanation": "Convenience-Stores sind kleinflächige Geschäfte mit begrenztem Sortiment (z. B. Snacks, Getränke, Zeitungen), langen Öffnungszeiten und meist etwas höheren Preisen."
    },
    {
      "question": "Worin unterscheidet sich ein unternehmenseigener Onlineshop von einem virtuellen Marktplatz wie Amazon?",
      "options": [
        "Ein eigener Onlineshop ist im Aufbau immer teurer und aufwendiger als ein Marktplatz",
        "Im eigenen Shop verkauft nur ein Unternehmen, am Marktplatz mehrere Anbieter",
        "Marktplätze existieren ausschließlich im Großhandel zwischen Unternehmen",
        "Onlineshops verzichten grundsätzlich auf Produktbilder und Bewertungen"
      ],
      "correctIndex": 1,
      "explanation": "Im eigenen Onlineshop bietet nur ein Unternehmen seine Produkte an, während auf einem virtuellen Marktplatz mehrere Anbieter unter einer gemeinsamen Plattform verkaufen."
    },
    {
      "question": "Loopy veranstaltet bei ihren Kundinnen und Kunden zuhause Verkostungsabende, bei denen sie ihre Süßwaren direkt verkauft. Welcher Form des ambulanten Handels entspricht das?",
      "options": [
        "Straßen- oder Markthandel (z. B. Marktstand)",
        "Zustellgroßhandel",
        "Franchise",
        "Direktvertrieb (z. B. Home-Party)"
      ],
      "correctIndex": 3,
      "explanation": "Direktvertrieb umfasst z. B. Vertreterverkauf, Verkaufsfahrten und Home-Partys, bei denen ohne festen Standort direkt beim Kunden verkauft wird."
    },
    {
      "question": "Was ist charakteristisch für den Cash-and-carry-Großhandel (Selbstbedienungsgroßhandel)?",
      "options": [
        "Der Großhändler liefert die Ware kostenlos mit eigenem Fuhrpark",
        "Der Kunde bezahlt sofort und holt die Ware selbst ab",
        "Der Großhändler mietet Regale in fremden Geschäften",
        "Der Verkauf erfolgt ausschließlich über gedruckte Kataloge"
      ],
      "correctIndex": 1,
      "explanation": "Beim Cash-and-carry-Großhandel bezahlt der Kunde die Ware sofort und übernimmt selbst den Transport, eine Lieferung durch den Großhändler entfällt."
    },
    {
      "question": "Was macht ein Regalgroßhändler (Rackjobber)?",
      "options": [
        "Er beliefert Handelsbetriebe ausschließlich per Katalogbestellung",
        "Er verkauft ausschließlich online an Endverbraucher",
        "Er mietet Regale in Handelsbetrieben und betreut sie selbst",
        "Er ist ein anderer Begriff für den Cash-and-carry-Großhandel"
      ],
      "correctIndex": 2,
      "explanation": "Ein Rackjobber mietet in fremden Handelsbetrieben Verkaufsflächen oder Regale, bestückt sie mit Waren und betreut sie selbst; der Handelsbetrieb erhält dafür eine Miete oder Umsatzprovision."
    },
    {
      "question": "Was kennzeichnet ein Franchisesystem?",
      "options": [
        "Ein selbstständiges Unternehmen nutzt gegen Gebühr Konzept und Marke eines anderen",
        "Mehrere Handelsunternehmen schließen sich zu einer Einkaufsgenossenschaft zusammen",
        "Ein Großhändler beliefert gleichzeitig mehrere unabhängige Einzelhändler in der Region",
        "Ein Unternehmen übernimmt alle Filialen eines Mitbewerbers"
      ],
      "correctIndex": 0,
      "explanation": "Ein Franchisenehmer ist ein selbstständiges Unternehmen, das sich per Franchisevertrag an einen Franchisegeber bindet und dafür ein bewährtes Konzept, eine etablierte Marke und Betreuung erhält."
    },
    {
      "question": "Was ist eine freiwillige Handelskette wie SPAR?",
      "options": [
        "Ein Verbund, bei dem alle Filialen einem einzigen Unternehmen gehören und von ihm geführt werden",
        "Selbstständige Händler kooperieren vertraglich bei Einkauf und Werbung unter einer Marke",
        "Ein Modell, bei dem ausschließlich der Großhandel die Regalpflege übernimmt",
        "Ein rein digitales Vertriebsmodell ohne eigene Filialen und Lager"
      ],
      "correctIndex": 1,
      "explanation": "Bei einer freiwilligen Handelskette verpflichten sich rechtlich selbstständige Einzelhandelsbetriebe vertraglich zu gemeinsamer Werbung und gemeinsamem Einkauf unter einer einheitlichen Organisationsmarke."
    },
    {
      "question": "Wie berechnet sich die Handelsspanne eines Produkts grundsätzlich?",
      "options": [
        "Einkaufspreis minus Herstellungskosten",
        "Verkaufspreis geteilt durch Einkaufspreis",
        "Verkaufspreis minus Einkaufspreis",
        "Fixkosten plus variable Kosten"
      ],
      "correctIndex": 2,
      "explanation": "Die Handelsspanne ergibt sich aus der Differenz zwischen Verkaufspreis und Einkaufspreis; sie muss die Kosten des Handelsbetriebs decken und einen Gewinn ermöglichen."
    }
  ],
  "businessplan-2jg": [
    {
      "question": "Loopy möchte einen Kredit für die Erweiterung ihres Candy Store beantragen. Wofür wird ein Businessplan laut Buch vor allem eingesetzt?",
      "options": [
        "Er stellt die Geschäftsidee dar und zeigt deren praktische Umsetzung",
        "Er ersetzt die laufende Buchhaltung und den Jahresabschluss eines Unternehmens",
        "Er dient ausschließlich der internen Urlaubsplanung der Mitarbeiter*innen",
        "Er wird nur von börsennotierten Unternehmen für die Hauptversammlung benötigt"
      ],
      "correctIndex": 0,
      "explanation": "Mit einem Businessplan wird die Geschäftsidee dargestellt und beschrieben, wie diese in der Praxis umgesetzt werden soll – ein durchdachter Businessplan ist ein wesentlicher Erfolgsfaktor, etwa um Banken oder Investor*innen zu überzeugen."
    },
    {
      "question": "Welcher Punkt zählt laut Buch NICHT zu den Bestandteilen eines Businessplans?",
      "options": [
        "Executive Summary",
        "Personalverrechnung",
        "Finanzplanung",
        "Chancen und Risiken"
      ],
      "correctIndex": 1,
      "explanation": "Die Bestandteile eines Businessplans sind laut Buch: Executive Summary, Unternehmen, Produkt/Dienstleistung, Branche/Markt/Wettbewerb, Marketing, Chancen und Risiken, Finanzplanung und Umsetzungsfahrplan – eine \"Personalverrechnung\" wird nicht als eigener Bestandteil genannt."
    },
    {
      "question": "Wie viele Seiten sollte ein Businessplan laut Buch üblicherweise umfassen?",
      "options": [
        "5 bis 10 Seiten",
        "50 bis 60 Seiten",
        "20 bis 30 Seiten",
        "100 bis 120 Seiten"
      ],
      "correctIndex": 2,
      "explanation": "Laut Buch sollte ein Businessplan ca. 20 bis 30 Seiten umfassen; detaillierte Unterlagen wie Lebensläufe oder Imagebroschüren werden als Anhang beigelegt."
    },
    {
      "question": "Wann wird die Executive Summary eines Businessplans laut Buch tatsächlich verfasst, obwohl sie am Anfang des Dokuments steht?",
      "options": [
        "Bevor die Geschäftsidee überhaupt feststeht",
        "Gleichzeitig mit dem Deckblatt",
        "Direkt zu Beginn, noch vor allen anderen Kapiteln des Plans",
        "Erst nach Fertigstellung des restlichen Businessplans"
      ],
      "correctIndex": 3,
      "explanation": "Die Executive Summary steht zwar am Anfang des Businessplans, wird jedoch laut Buch erst nach Fertigstellung des restlichen Businessplans verfasst."
    },
    {
      "question": "Welche zusätzlichen Punkte sollten laut Buch einen Businessplan ergänzen?",
      "options": [
        "Deckblatt, Inhaltsverzeichnis und ggf. Quellenverzeichnis",
        "Ein Organigramm sämtlicher Konkurrenzunternehmen",
        "Eine vollständige Kopie des Gesellschaftsvertrags samt Firmenbuchauszug",
        "Eine Liste aller bisherigen Mitbewerber-Insolvenzen"
      ],
      "correctIndex": 0,
      "explanation": "Laut Buch sollte ein Businessplan um Deckblatt, Inhaltsverzeichnis und – bei Verwendung sekundärer Marktforschung – ein Quellenverzeichnis ergänzt werden."
    },
    {
      "question": "Welche vier Punkte umfasst laut Buch das Unternehmens- und Gründerprofil im Businessplan?",
      "options": [
        "Finanzplanung und Kapitalbedarf, Marketingstrategie, Chancen und Risiken, Umsetzungsfahrplan",
        "Geschäftsidee und Vision, wichtige Personen, Rechtsform und Firmenname, Unternehmensstandort",
        "Produkt- und Sortimentspolitik, Preispolitik, Vertriebspolitik, Kommunikationspolitik",
        "Executive Summary, Deckblatt und Inhaltsverzeichnis, Anhang, Quellenverzeichnis"
      ],
      "correctIndex": 1,
      "explanation": "Das Unternehmens- und Gründerprofil umfasst laut Buch Geschäftsidee und Vision, wichtige Personen, Rechtsform und Firmenname sowie den Unternehmensstandort."
    },
    {
      "question": "Wie definiert das Buch eine Unternehmensvision?",
      "options": [
        "Eine detaillierte Jahresplanung der Finanzen mit konkreten Umsatz- und Kostenzielen",
        "Eine vollständige Liste aller Standortfaktoren, die für die Gründung relevant sind",
        "Ein langfristiges Vorstellungsbild des Unternehmens, das inspiriert und antreibt",
        "Eine kurzfristige operative Maßnahme, mit der Ziele im laufenden Quartal erreicht werden"
      ],
      "correctIndex": 2,
      "explanation": "Eine Unternehmensvision ist laut Buch ein Vorstellungsbild, mit dem das Unternehmen langfristig entwickelt werden soll; sie dient als Inspiration und Antriebsquelle (Beispiel im Buch: Netflix)."
    },
    {
      "question": "In welche drei Arten werden Standortfaktoren im Buch eingeteilt?",
      "options": [
        "Personalbezogene, finanzwirtschaftliche und infrastrukturbezogene Standortfaktoren",
        "Rechtliche, steuerliche und gesellschaftlich-soziale Standortfaktoren",
        "Kurzfristige, mittelfristige und langfristige Standortfaktoren",
        "Beschaffungsseitige, produktionsbezogene und absatzorientierte Standortfaktoren"
      ],
      "correctIndex": 3,
      "explanation": "Das Buch unterscheidet beschaffungsseitige, produktionsbezogene und absatzorientierte Standortfaktoren."
    },
    {
      "question": "Warum platzieren sich Lebensmittelketten laut Buch meist im Umkreis von Wohngebieten?",
      "options": [
        "Um möglichst nahe bei ihren Kunden zu sein",
        "Weil dort die Mieten am höchsten sind",
        "Weil dort keine Konkurrenz erlaubt ist",
        "Weil dort die Steuersätze am niedrigsten sind"
      ],
      "correctIndex": 0,
      "explanation": "Laut Buch wählen Lebensmittelketten ihren Standort in Wohngebieten, um möglichst nahe bei ihren Kunden zu sein (Beispiel für einen absatzorientierten Standortfaktor)."
    },
    {
      "question": "Was gilt laut Buch bei der Gewichtung der Standortfaktoren im Rahmen der Scoring-Methode?",
      "options": [
        "Jeder Faktor muss exakt gleich gewichtet werden",
        "Der Gesamtwert aller Gewichtungen muss 100 % ergeben",
        "Es dürfen maximal drei Standortfaktoren gewichtet werden",
        "Die Gewichtung erfolgt erst nach der Standortentscheidung"
      ],
      "correctIndex": 1,
      "explanation": "Bei der Scoring-Methode werden die Standortfaktoren gewichtet, wobei der Gesamtwert aller Gewichtungen laut Buch 100 % ergeben muss."
    },
    {
      "question": "Wie werden Unternehmensziele mit einer Laufzeit von 1 bis 3 Jahren laut Buch bezeichnet?",
      "options": [
        "Kurzfristige Ziele",
        "Langfristige Ziele",
        "Mittelfristige Ziele",
        "Dauerhafte Ziele"
      ],
      "correctIndex": 2,
      "explanation": "Ziele mit einer Laufzeit von 1 bis 3 Jahren gelten laut Buch als mittelfristige Ziele und betreffen die taktische Ausrichtung des Unternehmens."
    },
    {
      "question": "Wie kann das Marktpotenzial laut Buch auch in Geldwert angegeben werden?",
      "options": [
        "Indem man die Anzahl der Mitbewerber durch den Umsatz der Branche teilt",
        "Indem man die Fixkosten von den variablen Kosten des Vorjahres abzieht",
        "Indem man den Gewinn des Vorjahres mit der Zahl der Kund*innen multipliziert",
        "Indem man die theoretisch mögliche Absatzmenge mit dem Preis multipliziert"
      ],
      "correctIndex": 3,
      "explanation": "Das Marktpotenzial kann laut Buch in Geldwert angegeben werden, indem die theoretisch mögliche Absatzmenge mit dem Preis der Leistung multipliziert wird."
    },
    {
      "question": "Was versteht man laut Buch unter \"indirekter Konkurrenz\", z. B. im Beispiel des ORF?",
      "options": [
        "Unternehmen, die dieselben Kundenbedürfnisse anders stillen, z. B. Streaming-Plattformen",
        "Sender, die exakt das gleiche Programm zur gleichen Zeit für dasselbe Publikum ausstrahlen",
        "Unternehmen in einer komplett anderen Branche ohne jeden Bezug zum Kunden",
        "Konkurrenten, die das gleiche Angebot nur im Ausland und nicht in Österreich anbieten"
      ],
      "correctIndex": 0,
      "explanation": "Indirekte Konkurrenz sind laut Buch Unternehmen, die dieselben Kundenbedürfnisse auf andere Weise stillen – beim ORF-Beispiel etwa Streaming-Plattformen und soziale Medien statt anderer Fernsehsender."
    },
    {
      "question": "Welche vier Bereiche (\"4 Ps\") sollten laut Buch im Marketingteil eines Businessplans behandelt werden?",
      "options": [
        "Personalplanung, Prozessgestaltung, Produktionsplanung, Präsentationstechnik",
        "Produkt- und Sortimentspolitik, Preis- und Konditionenpolitik, Vertriebspolitik, Kommunikationspolitik",
        "Planungspolitik, Prüfungs- und Kontrollpolitik, Präsentationspolitik, Protokollierung",
        "Preisverhandlung mit Lieferant*innen, Partner- und Standortwahl, Positionierung am Markt, Personalbedarfsplanung"
      ],
      "correctIndex": 1,
      "explanation": "Im Businessplan ist laut Buch genau auf die 4 Ps einzugehen: Produkt- und Sortimentspolitik, Preis- und Konditionenpolitik, Vertriebspolitik und Kommunikationspolitik."
    },
    {
      "question": "Wozu dient die Analyse der externen Chancen und Risiken im Businessplan laut Buch?",
      "options": [
        "Um die internen Stärken und Schwächen der Mitarbeiter*innen zu bewerten",
        "Um den genauen Kaufpreis bzw. die Miete der Geschäftsräume festzulegen",
        "Um potenziellen Geldgeber*innen die Attraktivität der Geschäftsidee aufzuzeigen",
        "Um die Buchhaltung und den Jahresabschluss des ersten Geschäftsjahres zu erstellen"
      ],
      "correctIndex": 2,
      "explanation": "Die Auflistung der externen Chancen und Risiken hilft laut Buch potenziellen Geldgeber*innen bei der Einschätzung, wie attraktiv die Geschäftsidee ist."
    },
    {
      "question": "Welche zwei zentralen Fragen beantwortet laut Buch die Finanzplanung im Businessplan?",
      "options": [
        "Wie hoch ist der Umsatz der Konkurrenz? Wie viele Mitarbeiter braucht das Unternehmen?",
        "Welche Rechtsform passt am besten? Wo soll der Standort des Unternehmens sein?",
        "Wer sind die wichtigsten Kund*innen? Welche Werbemaßnahmen sind im ersten Jahr geplant?",
        "Wie hoch ist der Kapitalbedarf? Wie wird er mit Eigen- und/oder Fremdkapital gedeckt?"
      ],
      "correctIndex": 3,
      "explanation": "Die Finanzplanung ist laut Buch das Herzstück eines Businessplans und beantwortet, wie hoch der Kapitalbedarf ist und wie das Kapital durch Eigen- und/oder Fremdkapital aufgebracht werden soll."
    },
    {
      "question": "Was versteht man im Umsetzungsfahrplan eines Businessplans unter dem \"kritischen Pfad\"?",
      "options": [
        "Eine Kette von Aktivitäten, deren Verzögerung den ganzen Zeitplan gefährden kann",
        "Die günstigste Finanzierungsvariante für die gesamte Gründungsphase des Unternehmens",
        "Den Weg der Ware vom Rohstofflieferanten bis zum fertigen Produkt",
        "Die Liste aller Standortalternativen mit ihren jeweiligen Risiken"
      ],
      "correctIndex": 0,
      "explanation": "Der kritische Pfad bezeichnet laut Buch eine Kette von Aktivitäten im Umsetzungsfahrplan, bei der Verzögerungen einzelner Aktivitäten den gesamten Zeitplan gefährden können."
    },
    {
      "question": "Welcher der folgenden ist laut Buch KEIN genannter Businessplan-Wettbewerb für Schüler*innen?",
      "options": [
        "Businessplanwettbewerb next generation",
        "Junior Company Award",
        "jugend innovativ",
        "i2b (Businessplan Initiative)"
      ],
      "correctIndex": 1,
      "explanation": "Das Buch nennt als Businessplanwettbewerbe für Schüler*innen next generation, jugend innovativ und i2b (Businessplan Initiative) – einen \"Junior Company Award\" erwähnt es nicht."
    }
  ]
}
