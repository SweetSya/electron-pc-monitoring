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
      console.log('SAVING')
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
            '<i class="edit-content ti ti-pencil cursor-pointer absolute w-[20px] h-[20px] -right-[11px] -top-[11px] font-bold bg-white text-lg"></i><div class="box-content text-white w-full h-full flex"><div>'
        }
      ]
    }
    GridStack.setupDragIn('.block-dragable-in', undefined, insert.block)
    // set the drawer menu element
    const drawerTargetEl = document.getElementById('drawer-edit')
    const drawerContentTypeSelect = drawerTargetEl.querySelector('#content-type')
    const buttonContentSave = drawerTargetEl.querySelector('#content-save')
    drawerContentTypeSelect.addEventListener('change', (e) => {
      // remove all shown
      drawerTargetEl.querySelectorAll('.content-type-section.flex').forEach((item) => {
        item.classList.remove('flex')
        item.classList.add('hidden')
      })
      if (!e.target.value || e.target.value === '') {
        // remove btn
        buttonContentSave.classList.add('hidden')
        return
      }
      // add btn
      buttonContentSave.classList.remove('hidden')
      // add flex
      let section = drawerTargetEl.querySelector(`#content-${e.target.value}`)
      section.classList.add('flex')
      section.classList.remove('hidden')
    })

    buttonContentSave.addEventListener('click', (e) => {
      // get content
      let content_value = drawerTargetEl.querySelector('.content-type-section.flex .content-value')
        ? drawerTargetEl.querySelector('.content-type-section.flex .content-value').value
        : ''
      let id_box = e.currentTarget.dataset.grid
      document.querySelector(`#${id_box} .box-content`).innerHTML = drawerTargetEl.querySelector(
        '.content-type-section.flex input'
      ).value
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
        drawerTargetEl.querySelectorAll('.content-type-section.flex').forEach((item) => {
          item.classList.remove('flex')
          item.classList.add('hidden')
        })
        local_set('grids', all_grid_content())
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
    grid.on('removed', (event, items) => {
      local_set('grids', all_grid_content())
    })
    grid.on('added', (event, items) => {
      // add id to the new grid box
      let id = 'grid-' + Date.now()
      items.forEach((item) => {
        item.el.id = id
      })

      local_set('grids', all_grid_content())
      // add listener for edit content of the grid box
      let edit_buttons = document.querySelectorAll('.edit-content')
      edit_buttons[edit_buttons.length - 1].addEventListener('click', (e) => {
        let box_id = e.target.parentElement.parentElement.id
        let grid_boxes = local_get('grid_boxes') || []
        const item = grid_boxes.find((obj) => obj.id === box_id)
        if (item) {
          // Prepare drawer here
          console.log('prepare drawer')
        }
        drawerTargetEl.querySelector('#content-save').dataset.grid = box_id
        drawer.show()
      })
    })
    grid.on('change', (event, items) => {
      local_set('grids', all_grid_content())
      console.log(all_grid_content())
    })
    // Toogle trash box
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
    const all_grid_content = () => {
      return grid.engine.nodes.map((node) => ({
        id: node.el.id || null,
        grid: {
          coords: {
            x0: node.x,
            x1: node.x + node.w,
            y0: node.y,
            y1: node.y + node.h
          },
          w: node.w,
          h: node.h
        },
        block: {
          coords: {
            x0: node.x * eachBlock.width,
            x1: node.x * eachBlock.width + node.w * eachBlock.width,
            y0: node.y * eachBlock.height,
            y1: node.y * eachBlock.height + node.h * eachBlock.height
          },
          w: node.w * eachBlock.width,
          h: node.h * eachBlock.height
        },
        class: '',
        content: document.querySelector(`#${node.el.id}`).innerHTML
      }))
    }

    // Check for local storage
    if (local_get('grids')) {
      local_get('grids').forEach((box) => {
        const div = document.createElement('div')
        div.id = box.id
        div.classList.add('grid-stack-item')
        div.innerHTML = box.content
        grid.makeWidget(div, {
          x: box.grid.coords.x0,
          y: box.grid.coords.y0,
          w: box.grid.w,
          h: box.grid.h
        })
      })
    }
  })
}

init()
