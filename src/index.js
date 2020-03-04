import React from "react";
import ReactDOM from "react-dom";

// Нужно выяснить что здесь сломано или другие проблемы.
// Опишите в комментарии исправления/улучшения сделанные вами

// switched to using React Context api instead of stuffing store inside of window.
const StoreContext = React.createContext([]);

const createStore = (reducer, initialState) => {
  let currentState = initialState;
  const listeners = [];

  const getState = () => currentState;
  const dispatch = action => {
    currentState = reducer(currentState, action);
    listeners.forEach(listener => listener());
  };

  const subscribe = listener => listeners.push(listener);

  return { getState, dispatch, subscribe };
};

function useForceUpdate() {
  // this hook works like that by design
  // eslint-disable-next-line
  const [value, setValue] = React.useState(0);
  return () => setValue(v => 1 + v);
}

const connect = (mapStateToProps, mapDispatchToProps) => Component => {
  const WrappedComponent = props => {
    const [isSubscribed, setIsSubscribed] = React.useState(false);

    const forceUpdate = useForceUpdate();
    return (
      <StoreContext.Consumer>
        {store => {
          if (!isSubscribed) {
            store.subscribe(forceUpdate);
            setIsSubscribed(true);
          }

          return (
            <Component
              {...props}
              {...mapStateToProps(store.getState())}
              {...mapDispatchToProps(store.dispatch)}
            />
          );
        }}
      </StoreContext.Consumer>
    );
  };

  return WrappedComponent;
};

const Provider = ({ store, children }) => (
  <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
);

// APP

// actions
const ADD_TODO = "ADD_TODO";

// action creators
const addTodo = todo => ({
  type: ADD_TODO,
  payload: todo
});

// reducers
const reducer = (state = [], action) => {
  switch (action.type) {
    case ADD_TODO:
      // state object should not be edited!!!
      return [...new Set([action.payload, ...state])];
    default:
      return state;
  }
};

// components

// Unreasonable use of class-based component. Switched to functional.
const ToDoComponent = ({ title, todos, addTodo }) => {
  const [todoText, setTodoText] = React.useState("");

  return (
    <div>
      <label> {title || "Без названия"} </label>
      <div>
        <form
          onSubmit={e => {
            e.preventDefault();
            addTodo(todoText);
            setTodoText("");
          }}
        >
          <input
            value={todoText}
            placeholder="Название задачи"
            onChange={e => setTodoText(e.target.value)}
          />
          <button disabled={!todoText}>Добавить</button>
        </form>

        <ul>
          {todos.map(todo => (
            <li key={todo}>{todo}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const ToDo = connect(
  state => ({
    todos: state
  }),
  dispatch => ({
    addTodo: text => dispatch(addTodo(text))
  })
)(ToDoComponent);

// init
ReactDOM.render(
  <Provider store={createStore(reducer, [])}>
    <ToDo title="Список задач" />
  </Provider>,
  document.getElementById("app")
);
