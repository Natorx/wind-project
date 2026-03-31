### shell
`git commit -m "msg"` 中的 -m 指的是message，也就是添加提交信息
`nest generate resource users`
`nest g resource [module]`

### React组件通信和状态管理
    想要将一个文件拆开成模块，提高代码可读性，会导致变量不在同一个文件中，无法直接使用的情况，所以需要使用到组件通信。
    在项目中，sidebar就是一个很好的示例
1. ActiveItemProvider是一个状态容器，用它包裹App让整个应用能访问同一个状态的上下文，包裹内的所有组件都可以通过useActiveItem这个hook，从而实现跨组建通信
2. useState是React内置的hook，用于组件内部的状态管理
3. useActiveItem是自定义Hook，用useContext()封装，可以访问全局共享状态。
4. createContext可以创建一个包含上下文的对象
`createContext<T>(defaultValue) `创建上下文，`<Context.Provider value={state}>` 包裹组件树提供数据，子组件用 `useContext(Context)` 获取数据。
5. hooks：以use开头的，可以让韩叔叔组建拥有状态和副作用处理能力的特殊函数
6. 副作用：副作用指的是除了渲染之外的所有操作，包括数据获取，DOM操作，订阅和事件，计时器，日志记录（渲染是主作用，其他的都是副作用）

### UnoCSS的配置
`pnpm i unocss`，接着在Vite还有main中导入一下就好了