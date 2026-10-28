require 'jekyll'
require 'yaml'

root = File.expand_path('..', __dir__)
site = Jekyll::Site.new(Jekyll.configuration('source' => root, 'destination' => File.join(root, '_site'), 'quiet' => true))
site.read
site.generate
page = Jekyll::PageWithoutAFile.new(site, root, '', 'fixture.html')
page.data['fixture'] = YAML.safe_load_file(File.join(root, '_documentation', 'cours-eleve.exemple.yml'))
page.content = '{% include cours/cours-intro.html cours=page.fixture %}{% include cours/cours-activites.html cours=page.fixture %}{% include cours/cours-synthese.html cours=page.fixture %}'
site.pages << page
site.render
html = page.output
raise 'Nombre de champs incorrect' unless html.scan('data-answer-id=').length == 4
raise 'Nombre absent' unless html.include?('inputmode="decimal"')
raise 'QCM absent' unless html.include?('<select') && html.include?('value="multiplication"')
raise 'Facultatif mal compté' unless html.scan('data-required="false"').length == 1
raise 'Démarche non rendue en étapes' unless html.include?('<li>Repère le prix')
raise 'Application quotidienne absente' unless html.include?('Préparer l’achat de quelques fournitures.')
raise 'Bilan non rendu' unless html.include?('Quelle étape sais-tu expliquer ?')
puts 'OK : rendu en mémoire des nombres, QCM, texte, démarches, bilan et activité facultative. Aucune page de test écrite.'
