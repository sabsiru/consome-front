<template>
  <table>
    <thead>
    <tr>
      <th>ID</th>
      <th>이름</th>
      <th>생성일</th>
      <th>관리</th>
    </tr>
    </thead>
    <tbody>
    <tr v-for="board in boards" :key="board.id">
      <td>{{ board.id }}</td>
      <td>{{ board.name }}</td>
      <td>{{ board.createdAt }}</td>
      <td>
        <button @click="$emit('delete', board.id)">삭제</button>
      </td>
    </tr>
    </tbody>
  </table>
</template>

<script setup>
defineProps({
  boards: {
    type: Array,
    required: true,
  },
})
</script>

<style scoped>
table {
  width: 100%;
  border-collapse: collapse;
}
th,
td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: center;
}
</style>
