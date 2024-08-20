<template>
<div class="h-[10%] bg-gray-200 border-b border-gray-300 flex items-center px-3 justify-between" v-if="convsersation">
  <h3 class="font-semibold  text-gray-900">{{convsersation.title}}</h3>
  <span class="text-sm text-gray-500">{{convsersation.updatedAt}}</span>
</div>
<div class="w-[80%] mx-auto h-[75%] overflow-y-auto pt-2">
  <MessageList :messages="filteredMessages"/>
</div>
<div class="w-[80%] mx-auto h-[15%] flex items-center">
  <MessageInput  />
</div>
</template>
<script lang="ts" setup>
import { ref, watch, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import MessageInput from '../components/MessageInput.vue'
import MessageList from '../components/MessageList.vue'
import { useConversationStore } from '../stores/conversation'
import { MessageProps, ConversationProps, MessageStatus } from '../types'
import { db } from '../db'
const route = useRoute()
const conversationStore = useConversationStore()
const filteredMessages = ref<MessageProps[]>([])

let conversationId = ref(parseInt(route.params.id as string))
const initMessageId = parseInt(route.query.init as string)
const convsersation = computed(() => conversationStore.getConversationById(conversationId.value))
let lastQuestion = ''
const creatingInitialMessage = async () => {
  const createdData: Omit<MessageProps, 'id'> = {
    content: '',
    conversationId: conversationId.value,
    type: 'answer',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'loading'
  }
  const newMessageId = await db.messages.add(createdData)
  filteredMessages.value.push( { id: newMessageId, ...createdData })
  if (convsersation.value) {
    const provider = await db.providers.where({ id: convsersation.value.providerId }).first()
    if (provider) {
      console.log('provider', provider)
      await window.electronAPI.startChat({
        messageId: newMessageId,
        providerName: provider.name,
        selectedModel: convsersation.value.selectedModel,
        content: lastQuestion
      })
    }
  }
}
watch(() => route.params.id, async (newId: string) => {
  conversationId.value = parseInt(newId)
  filteredMessages.value = await db.messages.where({ conversationId: conversationId.value }).toArray()
})
onMounted(async () => {
  filteredMessages.value = await db.messages.where({ conversationId: conversationId.value }).toArray()
  if (initMessageId) {
    const lastMessage = await db.messages.where({ conversationId: conversationId.value }).last()
    lastQuestion = lastMessage?.content || ''
    await creatingInitialMessage()
  }
  window.electronAPI.onUpdateMessage(async (streamData) => {
    console.log('stream', streamData)
    // update database
    // update filteredMessages
    const { messageId, data } = streamData
    const currentMessage = await db.messages.where({ id: messageId }).first()
    if (currentMessage) {
      const updatedData = {
        content: currentMessage.content + data.result,
        status: data.is_end ? 'finished' : 'streaming' as MessageStatus,
        updatedAt: new Date().toISOString()
      }
      await db.messages.update(messageId, updatedData)
      const index = filteredMessages.value.findIndex(item => item.id === messageId)
      if (index !== -1) {
        filteredMessages.value[index] = { ...filteredMessages.value[index], ...updatedData }
      }
    }
  })
})
</script>