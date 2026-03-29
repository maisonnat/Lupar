import { handleNavigation, initializeEngine } from '@background/discovery-engine'

chrome.runtime.onInstalled.addListener(() => {
  initializeEngine()
})

chrome.webNavigation.onCompleted.addListener(
  (details) => {
    if (details.frameId === 0) {
      handleNavigation(details.url)
    }
  },
  { url: [{ schemes: ['https', 'http'] }] },
)

initializeEngine()
