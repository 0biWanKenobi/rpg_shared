import { computed, effect, ReadonlySignal, type Signal, signal } from "@preact/signals";
import type { App } from "obsidian";
import "./tabs.css";

export class Tabs {

    private options: TabOption[];
    private rootEl: HTMLDivElement | undefined;
    public readonly selectedTabIndex = signal(0);

    constructor(){
        this.options = [];        
    }
    
    addToContainer(containerEl: HTMLElement){
        this.rootEl = containerEl.createDiv();
        this.rootEl.className = 'rpg-tab-set';
        return this;
    }

    addTab(name: string, onClick: () => void){
        const option = new TabOption(name, this.options.length, this.selectedTabIndex, onClick);
        this.options.push(option);
        this.rootEl?.appendChild(option.rootEl);
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