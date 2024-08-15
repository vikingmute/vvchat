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
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import MessageInput from '../components/MessageInput.vue'
import MessageList from '../components/MessageList.vue'
import { MessageProps, ConversationProps } from '../types'
import { db } from '../db'
const route = useRoute()
const filteredMessages = ref<MessageProps[]>([])
const convsersation = ref<ConversationProps>()
let conversationId = parseInt(route.params.id as string)
const initMessageId = parseInt(route.query.init as string)
let lastQuestion = ''
const creatingInitialMessage = async () => {
  const createdData: Omit<MessageProps, 'id'> = {
    content: '',
    conversationId,
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
  conversationId = parseInt(newId)
  convsersation.value = await db.conversations.where({ id: conversationId }).first()
  filteredMessages.value = await db.messages.where({ conversationId }).toArray()
})
onMounted(async () => {
  convsersation.value = await db.conversations.where({ id: conversationId }).first()
  filteredMessages.value = await db.messages.where({ conversationId }).toArray()
  if (initMessageId) {
    const lastMessage = await db.messages.where({ conversationId }).last()
    lastQuestion = lastMessage?.content || ''
    await creatingInitialMessage()
  }
})
</script>