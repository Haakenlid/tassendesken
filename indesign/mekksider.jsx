#script "build newspaper pages from template file"
#target "indesign"
#targetengine "session"
#includepath "../includes"
#include "index.jsxinc"
#include "fetch_issue_data.jsxinc"
#include "renderContext.jsxinc"
#include "renderContext.ux.jsxinc"
#include "mekkSider.ux.jsxinc"
#include "split_document.jsxinc"

// var mal = File('~/Desktop/MAL_AVIS.indt')
// if (mal.exists) config.mal_avis = mal
// config.mal_avis = 'MAL_AVIS.indt'

function main() {
  switch (app.documents.length) {
    case 0:
      return openNewspaperTemplate()
    case 1:
      return prepareNewspaperTemplate()
    default:
      alert(
        'Opprett sider\r' + 'Lukk andre dokumenter før du oppretter ny avis.'
      )
  }
}

function prepareNewspaperTemplate() {
  // inserts context variables into template and splits it into pages
  var doc = app.documents[0]
  var context = fetchContextData()

  var rootDir = Folder(issueFolder(context.issue.nr) + '/INDESIGN/')
  mkdir(rootDir)
  var pages = map(
    applySpec({
      pageNumber: pipe(
        prop('documentOffset'),
        add(1)
      ),
      fileName: pipe(
        prop('documentOffset'),
        add(1),
        pageFileName(context.issue.pubDate, '1')
      ),
      masterName: path(['appliedMaster', 'name']),
      firstPage: pipe(
        prop('documentOffset'),
        either(eq(0), mod(2)),
        Boolean
      )
    })
  )(doc.pages)

  var splitPages = function(data) {
    var pages = pipe(
      prop('pages'),
      filter(prop('firstPage')),
      map(
        applySpec({
          number: prop('pageNumber'),
          file: function(pg) {
            return new File(data.rootDir + '/' + pg.fileName + '.indd')
          }
        })
      )
    )(data)
    splitDocument(doc, pages)
    var startWith = pages[0].file.openDlg(undefined, '*.indd', true)
    startWith && app.open(startWith)
  }
  var initialState = { pages: pages, rootDir: rootDir, issue: context.issue }
  splitPagesDialog(initialState, splitPages)
}

function openNewspaperTemplate() {
  // opens the newspaper template file
  var doc = app.open(File(config.mal_avis))
  dokTools.zoomOut()
  var context = fetchContextData()
  var changeList = buildChangeList(doc, context)
  var callback = pipe(
    prop('changeList'),
    curry(renderTemplate)(doc)
  )
  if (len(changeList))
    renderContextDialog({ changeList: changeList }, context, callback)
}

if (ifMain($.fileName)) {
  main()
}
// vi: ft=javascript
