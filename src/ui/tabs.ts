import { computed, effect, ReadonlySignal, type Signal, signal } from "@preact/signals";
import "./tabs.css";

export class Tabs {

    private options: TabOption[];
    private rootEl: HTMLDivElement;
    public readonly selectedTabIndex = signal(0);

    constructor(){
        this.options = [];
        this.rootEl = createDiv({cls: 'rpg-tab-set'});
    }
    
    addToContainer(containerEl: HTMLElement){        
        containerEl.appendChild(this.rootEl)
        return this;
    }

    addTab(name: string, onClick: () => void){
        const option = new TabOption(name, this.options.length, this.selectedTabIndex, onClick);
        this.options.push(option);
        this.rootEl.appendChild(option.rootEl);
        return this;
    }
}

class TabOption {

    private selected:ReadonlySignal<boolean>;
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

        this.selected = computed(() => selectedTabIndex.value === index);

        effect(() => {
            if(this.selected.value){
                this.rootEl.classList.add('rpg-tab-option-selected')
            } else {
                this.rootEl.classList.remove('rpg-tab-option-selected')
            }
        })

        this.rootEl.addEventListener('click', () => {   
            selectedTabIndex.value = index;
            this.onClick();
        });
    }
}