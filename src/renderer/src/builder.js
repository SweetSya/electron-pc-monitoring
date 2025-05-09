import 'gridstack/dist/gridstack.min.css'
import { GridStack } from 'gridstack'
import { Drawer } from 'flowbite'
import Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.min.css'

import { Swiper } from 'swiper'

function init() {
  window.addEventListener('DOMContentLoaded', () => {
    function hexToRgba(hex, alpha = 1) {
      // Remove '#' if present
      hex = hex.replace(/^#/, '')

      // Handle shorthand hex (e.g., "#abc")
      if (hex.length === 3) {
        hex = hex
          .split('')
          .map((c) => c + c)
          .join('')
      }

      const bigint = parseInt(hex, 16)
      const r = (bigint >> 16) & 255
      const g = (bigint >> 8) & 255
      const b = bigint & 255

      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }
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
    const contentSaveWrapper = drawerTargetEl.querySelector('.content-save-wrapper')
    drawerContentTypeSelect.addEventListener('change', (e) => {
      // remove all shown
      drawerTargetEl.querySelectorAll('.content-type-section.flex').forEach((item) => {
        item.classList.remove('flex')
        item.classList.add('hidden')
      })
      if (!e.target.value || e.target.value === '') {
        // remove btn
        contentSaveWrapper.classList.add('hidden')
        return
      }
      // add btn
      contentSaveWrapper.classList.remove('hidden')
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
      backdropClasses: 'pointer-events-none bg-gray-900/50 dark:bg-gray-900/80 fixed inset-0 z-30',
      onHide: () => {
        // Remove editing box id
        delete drawerTargetEl.dataset.editing
        drawerContentTypeSelect.value = ''
        contentSaveWrapper.classList.add('hidden')
        drawerTargetEl.querySelectorAll('.content-type-section.flex').forEach((item) => {
          item.classList.remove('flex')
          item.classList.add('hidden')
        })
        local_set('grids', all_grid_content())
      },
      onShow: () => {},
      onToggle: () => {}
    }

    // instance options object
    const drawerInstanceOptions = {
      id: 'dtawer-edit',
      override: true
    }
    const drawer = new Drawer(drawerTargetEl, drawerOptions, drawerInstanceOptions)

    // set the modal menu element
    const modalBgTargetEl = document.getElementById('modal-background')

    // options with default values
    const modalBgOptions = {
      placement: 'bottom-right',
      backdrop: 'dynamic',
      backdropClasses: 'bg-gray-900/50 dark:bg-gray-900/80 fixed inset-0 z-40',
      closable: true,
      onHide: () => {
        // delete image
        document.querySelector('#background-cropper').src
        document.querySelector('#background-input').value = ''
      },
      onShow: () => {},
      onToggle: () => {}
    }

    // instance options object
    const modalBgInstanceOptions = {
      id: 'modalEl',
      override: true
    }
    const modalBg = new Modal(modalBgTargetEl, modalBgOptions, modalBgInstanceOptions)
    document.querySelector('.close-modal-bg').addEventListener('click', () => {
      modalBg.hide()
    })
    // set Image background canvas grid
    const setBackgroundCanvas = () => {
      let temp = local_get('canvas') // assuming this returns an object with .background base64 string

      const img = new Image()
      img.onload = function () {
        const canvas = document.getElementById('background-canvas')
        const ctx = canvas.getContext('2d')

        const canvasWidth = canvas.width
        const canvasHeight = canvas.height

        const imgRatio = img.width / img.height
        const canvasRatio = canvasWidth / canvasHeight

        let drawWidth, drawHeight, offsetX, offsetY

        if (imgRatio > canvasRatio) {
          // Image is wider than canvas
          drawHeight = canvasHeight
          drawWidth = img.width * (canvasHeight / img.height)
          offsetX = -(drawWidth - canvasWidth) / 2
          offsetY = 0
        } else {
          // Image is taller than canvas
          drawWidth = canvasWidth
          drawHeight = img.height * (canvasWidth / img.width)
          offsetX = 0
          offsetY = -(drawHeight - canvasHeight) / 2
        }

        ctx.clearRect(0, 0, canvasWidth, canvasHeight) // clear existing
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight)
      }

      img.src = temp.background
    }

    document.querySelector('.close-drawer-edit').addEventListener('click', () => {
      drawer.hide()
    })
    // Save config to content
    buttonContentSave.addEventListener('click', (e) => {
      // get content
      let id_box = e.currentTarget.dataset.grid
      const content_data = {
        value:
          drawerTargetEl.querySelector('.content-type-section.flex .content-value').value ?? '',
        properties: [
          {
            target: `#${id_box} .box-content`,
            key: 'color',
            value:
              drawerTargetEl.querySelector('.content-type-section.flex .content-text-color')
                .value ?? 'white'
          },
          {
            target: `#${id_box} .box-content`,
            key: 'fontSize',
            value:
              `${drawerTargetEl.querySelector('.content-type-section.flex .content-text-size').value}px` ??
              '0px'
          },
          {
            target: `#${id_box} .box-content`,
            key: 'padding',
            value:
              `${drawerTargetEl.querySelector('.content-type-section.flex .content-padding').value}px` ??
              '0px'
          },
          {
            target: `#${id_box} .box-content`,
            key: 'borderRadius',
            value:
              `${drawerTargetEl.querySelector('.content-type-section.flex .content-border-radius').value}px` ??
              '0px'
          },
          {
            target: `#${id_box} .grid-stack-item-content`,
            key: 'padding',
            value:
              `${drawerTargetEl.querySelector('.content-type-section.flex .content-margin').value}px` ??
              '0px'
          },
          {
            target: `#${id_box} .box-content`,
            key: 'justifyContent',
            value:
              `${drawerTargetEl.querySelector('.content-type-section.flex .content-horizontal-alignment').value}` ??
              'start'
          },
          {
            target: `#${id_box} .box-content`,
            key: 'alignItems',
            value:
              `${drawerTargetEl.querySelector('.content-type-section.flex .content-vertical-alignment').value}` ??
              'start'
          },
          {
            target: `#${id_box} .box-content`,
            key: 'backgroundColor',
            value: hexToRgba(
              contentSaveWrapper.querySelector('.content-bg-color').value,
              contentSaveWrapper.querySelector('.content-bg-opacity').value / 10
            )
          }
        ]
      }
      document.querySelector(`#${id_box} .box-content`).innerHTML = content_data.value
      // Loop over properties
      content_data.properties.forEach((property) => {
        document.querySelector(property.target).style[property.key] = property.value
      })
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
        let grid_boxes = local_get('grids') || []
        const item = grid_boxes.find((obj) => obj.id === box_id)
        if (item) {
          // Prepare drawer here
          console.log('prepare drawer')
          console.log(item)
        }
        drawerTargetEl.querySelector('#content-save').dataset.grid = box_id
        drawer.show()
      })
    })
    grid.on('change', (event, items) => {
      local_set('grids', all_grid_content())
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
    // Cropper initiate
    const cropperOptions = {
      cropBoxResizable: true,
      data: {
        width: 480,
        height: 320
      },
      dragMode: 'none',
      center: true
    }
    let cropper = new Cropper(document.querySelector('#background-cropper img'), cropperOptions)
    // Background input
    document.querySelector('#background-input').addEventListener('change', (e) => {
      const file = e.target.files[0]
      const reader = new FileReader()

      reader.onload = function () {
        const base64DataUrl = reader.result
        document.querySelector('#background-cropper img').remove()
        document.querySelector('#background-cropper').innerHTML =
          `<img src="${base64DataUrl}" alt="Picture" class="object-fit-contain scale-50" />`
        cropper.destroy()
        cropper = new Cropper(document.querySelector('#background-cropper img'), cropperOptions)
      }

      if (file) {
        reader.readAsDataURL(file)
      }
      modalBg.show()
    })
    // save background image click
    document.querySelector('#background-image-save').addEventListener('click', (e) => {
      // Save get the cropped image
      const canvas = cropper.getCroppedCanvas({
        width: 480,
        height: 320
      })
      // Convert to base64 image
      const base64CroppedImage = canvas.toDataURL('image/png')
      let temp = local_get('canvas')
      temp.background = base64CroppedImage
      local_set('canvas', temp)
      setBackgroundCanvas()
      modalBg.hide()
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
        content: document.querySelector(`#${node.el.id}`).innerHTML,
        properties: {
          borderRadius: document.querySelector(`#${node.el.id}`).style.borderRadius,
          backgroundColor: document.querySelector(`#${node.el.id} .box-content`).style
            .backgroundColor,
          padding: document.querySelector(`#${node.el.id} .box-content`).style.padding,
          text: {
            size: document.querySelector(`#${node.el.id} .box-content`).style.fontSize,
            color: document.querySelector(`#${node.el.id} .box-content`).style.color
          }
        }
      }))
    }

    // Check for local storage
    if (!local_get('canvas')) {
      local_set('canvas', { background: '' })
    } else {
      setBackgroundCanvas()
    }
    if (local_get('grids')) {
      local_get('grids').forEach((box) => {
        const div = document.createElement('div')
        div.id = box.id
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
