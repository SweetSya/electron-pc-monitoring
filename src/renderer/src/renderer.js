function init() {
  window.addEventListener('DOMContentLoaded', () => {
    clearAndReadLocalStorage()
    doAThing()
    populateTable()

    // Listen for Run as Admin Toogle
    const toggleRunAsAdmin = document.querySelector('#toggle-run-as-admin')
    toggleRunAsAdmin.addEventListener('change', () => {
      localStorage.setItem('run_as_admin', toggleRunAsAdmin.checked)
      // window.electron.ipcRenderer.send('ipc-run-as-administrator', toggleRunAsAdmin.checked)
    })
    // Listen for Run at Startup Toogle
    const toggleRunAtStartup = document.querySelector('#toggle-run-at-startup')
    toggleRunAtStartup.addEventListener('change', () => {
      localStorage.setItem('run_at_startup', toggleRunAtStartup.checked)
      // window.electron.ipcRenderer.send('ipc-run-at-startup', toggleRunAtStartup.checked)
    })
    // Listen for Start Monitoring Toggle
    const toggleStartMonitoring = document.querySelector('#toggle-start-monitoring')
    toggleStartMonitoring.addEventListener('change', () => {
      localStorage.setItem('start_monitoring', toggleStartMonitoring.checked)
      // window.electron.ipcRenderer.send('ipc-run-at-startup', toggleStartMonitoring.checked)
    })
  })
}

function clearAndReadLocalStorage() {
  localStorage.clear()
}
function populateTable() {
  let table_body = document.querySelector('.table-data')
  table_body.innerHTML = '<tr><td colspan="2" class="text-center py-5">Loading data..</td></tr>'

  window.electron.ipcRenderer.invoke('ipc-populate-table-request').then((result) => {
    table_body.innerHTML = ''
    result.split('|').forEach((item) => {
      let data = item.split('=')
      let element = document.createElement('tr')
      element.className = 'border-b border-white/30'
      element.innerHTML = `
        <td class="px-2 py-2">${data[0]}</td>
        <td class="px-2 py-2">${data[1]}</td>
      `
      table_body.append(element)
    })
  })
}
function doAThing() {
  // const versions = window.electron.process.versions
  // replaceText('.electron-version', `Electron v${versions.electron}`)
  // replaceText('.chrome-version', `Chromium v${versions.chrome}`)
  // replaceText('.node-version', `Node v${versions.node}`)

  const app_version = 'v1.0'
  replaceText('.app-version', app_version)
}

function replaceText(selector, text) {
  const element = document.querySelector(selector)
  if (element) {
    element.innerText = text
  }
}

init()
