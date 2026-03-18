import { createContext, useContext, useReducer } from 'react'

const CartContext = createContext()

export function useCart() {
  return useContext(CartContext)
}

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const key = `${action.item.id}-${action.item.size}-${action.item.color}`
      const existing = state.find((i) => i.key === key)
      if (existing) {
        return state.map((i) =>
          i.key === key ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...state, { ...action.item, key, quantity: 1 }]
    }
    case 'REMOVE_ITEM':
      return state.filter((i) => i.key !== action.key)
    case 'UPDATE_QTY':
      return state.map((i) =>
        i.key === action.key ? { ...i, quantity: action.qty } : i
      )
    case 'CLEAR':
      return []
    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [cart, dispatch] = useReducer(cartReducer, [])

  const addItem = (item) => dispatch({ type: 'ADD_ITEM', item })
  const removeItem = (key) => dispatch({ type: 'REMOVE_ITEM', key })
  const updateQty = (key, qty) => dispatch({ type: 'UPDATE_QTY', key, qty })
  const clearCart = () => dispatch({ type: 'CLEAR' })

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const itemCount = cart.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext.Provider value={{ cart, addItem, removeItem, updateQty, clearCart, total, itemCount }}>
      {children}
    </CartContext.Provider>
  )
}
