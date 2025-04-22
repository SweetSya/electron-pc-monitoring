import 'gridstack/dist/gridstack.min.css'
import { GridStack } from 'gridstack'
import { Drawer } from 'flowbite'

import { Swiper } from 'swiper'

function init() {
  window.addEventListener('DOMContentLoaded', () => {
    const local_get = (key) => {
      return JSON.parse(localStorage.getItem(key))
    }
    const local_set = (key, data) => {
      return localStorage.setItem(key, JSON.stringify(data))
    }
    let toolsMenu = document.querySelector('#tools-menu')
    const eachBlock = {
      width: 60,
      height: 40
    }
    GridStack.renderCB = function (el, w) {
      el.innerHTML = w.content
    }
    let grid_list = []
    let grid = GridStack.init(
      {
        acceptWidgets: function (el) {
          return true
        },
        removable: '#trash',
        children: grid_list,
        column: 16,
        row: 16,
        maxRow: 16,
        cellHeight: 20,
        float: true,
        margin: 2,
        placeholderClass: 'bg-white/20'
      },
      '#grid-stack'
    )
    let insert = {
      block: [
        {
          content:
            '<i class="edit-content ti ti-pencil cursor-pointer absolute w-[20px] h-[20px] -right-[11px] -top-[11px] font-bold bg-white text-lg"><i>'
        }
      ]
    }
    GridStack.setupDragIn('.block-dragable-in', undefined, insert.block)
    // set the drawer menu element
    const drawerTargetEl = document.getElementById('drawer-edit')
    const drawerContentTypeSelect = drawerTargetEl.querySelector('#content-type')
    drawerContentTypeSelect.addEventListener('change', (e) => {
      // remove all shown
      drawerTargetEl.querySelectorAll('.content-type-section.flex').forEach((item) => {
        item.classList.remove('flex')
        item.classList.add('hidden')
      })
      if (!e.target.value || e.target.value === '') {
        return
      }
      // add flex
      let section = drawerTargetEl.querySelector(`#content-${e.target.value}`)
      section.classList.add('flex')
      section.classList.remove('hidden')
    })

    // options with default values
    const drawerOptions = {
      placement: 'left',
      backdrop: true,
      bodyScrolling: false,
      edge: false,
      edgeOffset: '',
      backdropClasses: 'bg-gray-900/50 dark:bg-gray-900/80 fixed inset-0 z-30',
      onHide: () => {
        // Remove editing box id
        delete drawerTargetEl.dataset.editing
        drawerContentTypeSelect.value = ''
      },
      onShow: () => {
        console.log('drawer is shown')
      },
      onToggle: () => {
        console.log('drawer has been toggled')
      }
    }

    // instance options object
    const drawerInstanceOptions = {
      id: 'dtawer-edit',
      override: true
    }
    const drawer = new Drawer(drawerTargetEl, drawerOptions, drawerInstanceOptions)
    document.querySelector('.close-drawer-edit').addEventListener('click', () => {
      drawer.hide()
    })
    grid.on('added', (event, items) => {
      // add id to the new grid box
      items.forEach((item) => {
        item.el.id = 'grid-' + Date.now()
      })
      // add listener for edit content of the grid box
      document.querySelectorAll('.edit-content').forEach((element) => {
        element.addEventListener('click', (e) => {
          let box_id = e.target.parentElement.parentElement.id
          let grid_boxes = local_get('grid_boxes') || []
          const item = grid_boxes.find((obj) => obj.id === box_id)
          if (item) {
            // Prepare drawer here
            console.log('prepare drawer')
          }
          drawerTargetEl.dataset.editing = box_id
          drawer.show()
        })
      })
    })
    grid.on('change', (event, items) => {
      const allCoords = grid.engine.nodes.map((node) => ({
        id: node.el.id || null,
        x0: node.x * eachBlock.width,
        x1: node.x * eachBlock.width + node.w * eachBlock.width,
        y0: node.y * eachBlock.height,
        y1: node.y * eachBlock.height + node.h * eachBlock.height,
        w: node.w * eachBlock.width,
        h: node.h * eachBlock.height
      }))

      console.log('All widget coordinates:', allCoords)
    })
    const toogleTrash = (state) => {
      if (state == true) {
        toolsMenu.querySelector('#main').classList.remove('flex')
        toolsMenu.querySelector('#main').classList.add('hidden')
        toolsMenu.querySelector('#trash').classList.remove('hidden')
        toolsMenu.querySelector('#trash').classList.add('flex')
      }
      if (state == false) {
        toolsMenu.querySelector('#main').classList.add('flex')
        toolsMenu.querySelector('#main').classList.remove('hidden')
        toolsMenu.querySelector('#trash').classList.add('hidden')
        toolsMenu.querySelector('#trash').classList.remove('flex')
      }
    }
    grid.on('dragstart', (event, items) => {
      toogleTrash(true)
    })
    grid.on('dragstop', (event, items) => {
      toogleTrash(false)
    })
  })
}

init()
