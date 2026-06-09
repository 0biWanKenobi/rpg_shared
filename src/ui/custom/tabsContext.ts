import { createContext } from "svelte";

interface ITabsContext {
    state: {
        selected: number
    }
}

export const [getTabsContext, updateTabsContext] = createContext<ITabsContext>();