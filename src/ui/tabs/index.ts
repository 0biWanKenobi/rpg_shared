import { computed, effect, ReadonlySignal, type Signal, signal } from "@preact/signals";
import "./tabs.css";

class Tabs {

    #options: TabOption[];
    #rootEl: HTMLDivElement;
    #tabHeaders: HTMLDivElement
    #tabsContainer: HTMLDivElement
    public readonly selectedTabIndex = signal(0);

    constructor(){
        this.#options = [];
        this.#rootEl = createDiv({cls: 'rpg-tab-component'});
        this.#tabHeaders = this.#rootEl.createDiv({cls: 'rpg-tab-set'})
        this.#tabsContainer = this.#rootEl.createDiv({cls: 'rpg-tab-container'})
        Object.seal(this);
    }
    
    addToContainer(containerEl: HTMLElement){        
        containerEl.appendChild(this.#rootEl)
        return this;
    }

    addTab(name: string, builder: (container: HTMLElement) => void){
        const tabIndex = this.#options.length;
        const onClick = () => {
            this.selectedTabIndex.value = tabIndex;
            for (const tabContent of this.#tabsContainer.children) {
                tabContent.addClass('hidden')
            }
            tab.removeClass('hidden');
        }
        const tab = this.#tabsContainer.createDiv({cls: `rpg-tab rpg-tab-${tabIndex}`})
        if(tabIndex > 0) tab.addClass('hidden')
        builder(tab);
        
        const option = new TabOption(name, this.#options.length, this.selectedTabIndex, onClick);
        this.#options.push(option);
        this.#tabHeaders.appendChild(option.rootEl);
        return this;
    }
}

Object.freeze(Tabs.prototype)
export {Tabs}

class TabOption {

    #selected:ReadonlySignal<boolean>;
    readonly rootEl: HTMLDivElement;
    name: string;
    onClick: () => void;

    constructor(
        name: string,
        index: number,
        selectedTabIndex: Signal<number>,
        onClick: TabOption['onClick']
    ) {
        this.name = name;
        this.onClick = onClick;
        this.rootEl = createDiv()
        this.rootEl.setText(this.name);
        this.rootEl.className = 'rpg-tab-option';

        this.#selected = computed(() => selectedTabIndex.value === index);

        effect(() => {
            if(this.#selected.value){
                this.rootEl.classList.add('rpg-tab-option-selected')
            } else {
                this.rootEl.classList.remove('rpg-tab-option-selected')
            }
        })

        this.rootEl.addEventListener('click', () => {   
            selectedTabIndex.value = index;
            this.onClick();
        });

        Object.seal(this);
    }
}

Object.freeze(TabOption.prototype)