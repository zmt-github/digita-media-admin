import { getToken } from '@/utils/cache/cacheToken'
import store from '@/store'
import eventBus from '@/utils/eventBus'

const heartTime = 30 * 1000

const reconnectTime = 3 * 1000

const reconnectMaxNum = 10

let websocketInstance = {}

let options = {}

let reconnectNum = 0

let reconnectTimer = null

let heartTimer = null

function getUrl (options) {
  const url = options && options.url ? options.url : window.globalConfig.ws_url
  return `${url + getToken()}?token=${getToken()}&userId=${store.getters.user.userId}`
}

function reconnect () {
  if (reconnectNum > reconnectMaxNum) {
    console.log('websocket重连失败')
    reconnectTimer && clearTimeout(reconnectTimer)
    return
  }
  initWebsocket(options)

  reconnectNum++

  console.log('重连:' + reconnectNum + '次')
}

function keepAliveHeart () {
  heartTimer = setTimeout(() => {
    console.log('发送心跳')
    send(JSON.stringify({ data: { code: 'heart' } }))
    heartTimer && clearTimeout(heartTimer)
    keepAliveHeart()
  }, heartTime)
}

export function onOpen () {
  console.log('WebSocket onOpen')
  reconnectTimer && clearTimeout(reconnectTimer)
  keepAliveHeart()
}

export function onMessage (data) {
  console.log(data.data)
  try {
    const jsonData = data.data

    const content = JSON.parse(jsonData)

    eventBus.emit('devStatus', content)
  } catch (e) {
    console.log(e)
  }
}

export function onClose () {
  console.log('WebSocket closed')
  heartTimer && clearTimeout(heartTimer)
}

export function onError (e) {
  console.log(e)
  reconnectTimer && clearTimeout(reconnectTimer)
  reconnectTimer = setTimeout(() => {
    reconnect()
  }, reconnectTime)
}

export function initWebsocket (optionsObj) {
  if (typeof WebSocket === 'undefined') {
    alert('您的浏览器不支持WebSocket')
    return
  }
  console.log('init websocket')

  options = optionsObj

  const url = getUrl(options)

  websocketInstance = new WebSocket(url)

  websocketInstance.onopen = onOpen

  websocketInstance.onmessage = onMessage

  websocketInstance.onclose = onClose

  websocketInstance.onerror = onError
}

export function send (msg) {
  websocketInstance.send(msg)
}

export function close () {
  try {
    websocketInstance.close()
  } catch (e) {
    // console.log(e)
  }
}
