<template>
  <div class=" flex items-center justify-between h-screen">
    <div class=" w-[300px] bg-gray-200 h-full border-r border-gray-300">
      <div class="h-[90%] overflow-y-auto">
        <ConversationList :items="conversations"/>
      </div>
      <div class="h-[10%] grid grid-cols-2 gap-2 p-2">
        <RouterLink to="/">
          <Button icon-name="radix-icons:chat-bubble" class="w-full">
            新建聊天
          </Button>
        </RouterLink>
        <RouterLink to="/settings">
          <Button icon-name="radix-icons:gear" plain class="w-full">
            应用设置
          </Button>
        </RouterLink>
      </div>
    </div>
    <div class="h-full flex-1">
      <RouterView/>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { conversations, providers } from './testData'
import { db } from './db'
import ConversationList from './components/ConversationList.vue'
import Button from './components/Button.vue'
console.log('👋 This message is being logged by "App.vue", included via Vite');
onMounted(async () => {
  // const insertedId = await db.providers.add(providers[0])
  // console.log('insertedId', insertedId)
  const items = await db.providers.where({ id: 2}).toArray()
  console.log('items', items)
  const updatedItem = await db.providers.update(1, { desc: 'updated desc'})
  console.log('updatedItem', updatedItem)
  const deletedItem = await db.providers.delete(1)
  console.log('deletedItem', deletedItem)
})
</script>