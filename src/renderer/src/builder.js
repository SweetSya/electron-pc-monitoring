import 'gridstack/dist/gridstack.min.css'
import { GridStack } from 'gridstack'

import { Swiper } from 'swiper'

function init() {
  window.addEventListener('DOMContentLoaded', () => {
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
            '<i onclick="console.log("wda")" class="edit-content ti ti-edit cursor-pointer absolute w-[20px] h-[20px] -right-[11px] -top-[11px] font-bold bg-white text-lg"><i>'
        }
      ]
    }
    GridStack.setupDragIn('.block-dragable-in', undefined, insert.block)

    grid.on('change', function (event, items) {
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
    grid.on('dragstart', function (event, items) {
      toogleTrash(true)
    })
    grid.on('dragstop', function (event, items) {
      toogleTrash(false)
    })
  })
}

init()
