<script>
import { INPUTS_GROUPS, INPUTS, DOCUMENT_COLOR } from '../../config/agreement-editor.js';
import { VueDraggableNext } from 'vue-draggable-next';

export default {
  name: 'HrbrAgreementEditorInputs',

  setup() {
    return {};
  },

  props: {
    activeSigner: {
      type: Number,
    },
    signersListInfo: {
      type: Array,
      default: () => [],
    },

    // ckeditor props
    isCkeditorAgreement: {
      type: Boolean,
      default: false,
    },
  },

  components: {
    draggable: VueDraggableNext,
  },

  data() {
    return {
      inputs: INPUTS,
      inputsGroups: INPUTS_GROUPS,
      inputsFilter: '',
      activeInputsGroup: 'most-popular',
      verificationChecksEnabled: false,
      touchData: {
        top: 0,
        left: 0
      },
      isDropdownOpen: false,
      draggedInputId: null,
    };
  },

  computed: {
    filteredGroups() {
      // if validation checks are enabled, show all groups
      if (this.verificationChecksEnabled) {
        return this.inputsGroups;
      }
      // otherwise, hide the user check group
      return this.inputsGroups.filter((group) => group.id !== 'user-check-group');
    },

    filteredInputs() {
      const filter = this.inputsFilter.toLowerCase();
      let { inputs } = this;

      inputs = inputs.filter((input) => {
        const eligibleValues = input.inputtileeligibleagreementinputtabs;
        return (
          (this.activeSigner === null && eligibleValues.includes('DOCUMENT')) ||
          (this.activeSigner !== null && eligibleValues.includes('SIGNER'))
        );
      });

      if (filter && filter.length > 1) {
        return inputs.filter((input) => {
          const title = input.inputtiletitle.toLowerCase();
          const description = input.inputtiledescription.toLowerCase();
          return title.includes(filter) || description.includes(filter);
        });
      }

      return inputs.filter((input) => input.group.includes(this.activeInputsGroup));
    },

    filteredActiveSigners() {
      return this.signersListInfo
        .filter((signer) => signer.isactive)
        .sort((s1, s2) => s1.sortorder - s2.sortorder);
    },

    activeSignerTitle() {
      if (this.activeSigner === null) return 'Agreement owner';

      const signer = this.filteredActiveSigners.find((s) => s.signerindex === this.activeSigner);
      if (!signer) return 'Select a signer';

      if (signer.signername !== null) {
        return signer.signername;
      }
      return `Signer ${signer.signerindex + 1}`;
    },

    activeSignerInfo() {
      if (this.activeSigner === null) return null;

      const signerInfo = this.filteredActiveSigners.find(
        (signer) => signer.signerindex === this.activeSigner,
      );
      if (!signerInfo) return null;
      return signerInfo;
    },

    activeSignerColor() {
      return this.activeSignerInfo !== null ? this.activeSignerInfo.signercolor : DOCUMENT_COLOR;
    },
  },

  methods: {
    updateDraggedInputId(inputId) {
      this.draggedInputId = inputId;
      this.$emit('dragged-input-id-change', inputId);
    },

    updateDraggedInputData(dragInputData) {
      this.$emit('dragged-input-data-change', dragInputData);
    },

    updateActiveSigner(signerIdx) {
      this.$emit('active-signer-change', signerIdx);
    },

    updateIsDraggingInput(isDragging) {
      this.$emit('is-dragging-input-change', isDragging);
    },

    updateActiveInputsGroup(groupId) {
      this.activeInputsGroup = groupId;
    },

    onInputsGroupClick(groupId) {
      this.updateActiveInputsGroup(groupId);
      this.resetInputsFilter();
    },

    onDragStart(event) {
      this.setDragInputId(event);
      this.setDragInputData(event);
      this.updateIsDraggingInput(true);
    },

    onDragEnd(event) {
      this.updateIsDraggingInput(false);
    },

    setData(dataTransfer, dragEl) {
      dataTransfer.clearData('fieldAnnotation');

      let { id: inputId } = dragEl.dataset;
      let sourceField = this.inputs.find((input) => input.id === inputId);

      let data = {
        // Provide attrs if handle field drop inside editor.
        // attributes: {
        //   displayLabel: 'Enter your info',
        //   fieldId: `agreementinput-${Date.now()}-${Math.floor(Math.random() * 1000000000000)}`,
        //   fieldType: 'TEXTINPUT',
        //   fieldColor: '#6943d0',
        // },
        sourceField,
      };

      dataTransfer.setData('fieldAnnotation', JSON.stringify(data));
      
      // If this is CK then we must override 'effectAllowed' property to 'all',
      // otherwise drag&drop for annotations will not work
      // if (this.isCkeditorAgreement) {
      //   dataTransfer.effectAllowed = 'all';
      // }
    },

    setDragInputId(e) {
      const { id: inputId } = e.item.dataset;
      this.updateDraggedInputId(inputId);
    },

    setDragInputData(event) {
      const { originalEvent } = event;
      const { layerX, layerY, srcElement } = originalEvent;
      const target = event.item || srcElement;
      const rect = target.getBoundingClientRect();

      const dragInputData = {
        offsetX: layerX,
        offsetY: layerY,
        elWidth: rect.width,
        elHeight: rect.height,
      };

      this.updateDraggedInputData(dragInputData);
    },

    getDropdownSignerItem(signerIdx) {
      const signer = this.filteredActiveSigners.find((s) => s.signerindex === signerIdx);
      const signerName =
        signer.signername !== null ? signer.signername : `Signer ${signer.signerindex + 1}`;
      const signerEmail = signer.signeremail !== null ? `(${signer.signeremail})` : '';
      return `${signerName} ${signerEmail}`;
    },

    getLocalDateStr() {
      try {
        const date = new Date();
        const ye = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(date);
        const mo = new Intl.DateTimeFormat('en', { month: 'short' }).format(date);
        const da = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(date);
        return `${mo} ${da} ${ye}`;
      } catch (err) {
        return 'today';
      }
    },

    setDateInputCurrentDate() {
      const localDateStr = this.getLocalDateStr();

      this.inputs.forEach((item) => {
        const targetInput = item;
        if (
          targetInput.inputtiletype === 'DATEINPUT' ||
          targetInput.inputtiletype === 'SIGNDATEINPUT'
        ) {
          targetInput.inputtiledescription = `(${localDateStr})`;
        }
      });
    },

    resetInputsFilter() {
      this.inputsFilter = '';
    },

    // 80 - 50%
    getHexColorWithTransparency(color, code = '80') {
      return `${color}${code}`;
    },

    // checkValidationsEnabled() {
    //   this.verificationChecksEnabled = false;
    //   let isVerificationCheckAllowed =
    //     this.harbourStore.workspaceCustomProperties?.verification_checks_enabled;
    //   console.log('--verificationCheckEnabled:', isVerificationCheckAllowed);
    //   if (isVerificationCheckAllowed === 'true' || isVerificationCheckAllowed === true) {
    //     this.verificationChecksEnabled = true;
    //   }
    // },

    generateAgreementInputHtmlId(inputTitle) {
      const titleSanitized = this.sanitizeDisplayField(inputTitle);
      return `agreement-input-${titleSanitized}`;
    },

    sanitizeDisplayField(itemDisplayLabel) {
      if (!itemDisplayLabel) {
        return null;
      }
      let sanitized = itemDisplayLabel.toLowerCase();
      sanitized = sanitized.replaceAll(' ', '-');
      sanitized = sanitized.replace(/[^A-Za-z0-9\-]/g, '');
      sanitized = sanitized.replace(/[^A-Za-z0-9]+$/, '');

      return sanitized;
    },

    // onInputTouchMove(evt) {
    //   const touchLocation = evt.targetTouches[0];
    //   this.touchData.top = touchLocation.pageY;
    //   this.touchData.left = touchLocation.pageX;
    // },

    toggleDropdownMenu() {
      this.isDropdownOpen = !this.isDropdownOpen;
    },

    closeDropdownMenu() {
      this.isDropdownOpen = false;
    },
  },

  created() {
    this.setDateInputCurrentDate();
    // this.checkValidationsEnabled();
  },
};
</script>

<template>
  <div class="hrbr-agreement-editor-inputs" id="hrbr-agreement-editor-inputs">
    <div class="hrbr-agreement-editor-inputs__head">
      <div class="hrbr-agreement-editor-inputs__signers-dropdown-container">
        <div class="hrbr-agreement-editor-inputs__signers-dropdown-label">Signer</div>
        
        <div class="hrbr-agreement-editor-inputs-dropdown">
          <div class="hrbr-agreement-editor-inputs-dropdown__selected" @click.stop="toggleDropdownMenu">
            <span
              class="hrbr-agreement-editor-inputs-dropdown__signers-dropdown-selected-color"
              :style="{ backgroundColor: activeSignerColor }">
            </span>
            <span class="hrbr-agreement-editor-inputs-dropdown__signers-dropdown-selected-value">
              {{ activeSignerTitle }}
            </span>
          </div>

          <div class="hrbr-agreement-editor-inputs-dropdown__menu" v-show="isDropdownOpen">
            <div class="hrbr-agreement-editor-inputs-dropdown__menu-wrapper">
              <div class="hrbr-agreement-editor-inputs-dropdown__list">
                <div 
                  class="hrbr-agreement-editor-inputs-dropdown__list-item" 
                  :class="{'is-active': activeSigner === null}"
                  @click="updateActiveSigner(null); closeDropdownMenu();">
                  <div class="hrbr-agreement-editor-inputs-dropdown__list-item-text">
                    Agreement Owner
                  </div>
                </div>

                <div 
                  class="hrbr-agreement-editor-inputs-dropdown__list-item" 
                  :class="{'is-active': activeSigner === signerIdx}"
                  v-for="(signer, signerIdx) in filteredActiveSigners"
                  :key="signer.signerid"
                  @click="updateActiveSigner(signerIdx); closeDropdownMenu();">
                  <div class="hrbr-agreement-editor-inputs-dropdown__list-item-text">
                    {{ getDropdownSignerItem(signerIdx) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <div class="hrbr-agreement-editor-inputs__body">
      <div class="hrbr-agreement-editor-inputs__groups">
        <div id="hrbr-ae-input-groups-list" class="hrbr-agreement-editor-inputs__groups-list">
          <div
            class="hrbr-agreement-editor-inputs__group"
            :class="{
              'hrbr-agreement-editor-inputs__group--active':
                group.id === activeInputsGroup && !inputsFilter,
            }"
            v-for="group in filteredGroups"
            :key="group.id"
            data-testid="input-group"
            @click="onInputsGroupClick(group.id)">
            <div class="hrbr-agreement-editor-inputs__group-icon">
              <span>📙</span>
            </div>
            <div class="hrbr-agreement-editor-inputs__group-title">
              <div class="hrbr-agreement-editor-inputs__group-title-text">
                {{ group.title }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="hrbr-agreement-editor-inputs__inputs">
        <div class="hrbr-agreement-editor-inputs__inputs-list" v-if="filteredInputs.length">
          <draggable
            id="draggable-input-group-list"
            class="hrbr-agreement-editor-inputs__draggable"
            @start="onDragStart($event)"
            @end="onDragEnd($event)"
            :list="filteredInputs"
            :sort="false"
            :group="{ name: 'tileInputs', pull: 'clone', put: false }"
            :setData="setData">
            <div
              class="hrbr-agreement-editor-inputs__input"
              v-for="input in filteredInputs"
              :key="input.id"
              :data-id="input.id"
              :id="generateAgreementInputHtmlId(input.inputtiletitle)"
              data-testid="agreement-editor-input"
            >
              <div
                class="hrbr-agreement-editor-inputs__input-drag"
                :style="{ backgroundColor: getHexColorWithTransparency(activeSignerColor, '33') }">
                <span>⠿</span>
              </div>
              <div class="hrbr-agreement-editor-inputs__input-wrap">
                <div class="hrbr-agreement-editor-inputs__input-icon">
                  <span>📌</span>
                </div>
                <div class="hrbr-agreement-editor-inputs__input-info">
                  <div class="hrbr-agreement-editor-inputs__input-title">
                    {{ input.inputtiletitle }}
                  </div>
                  <div class="hrbr-agreement-editor-inputs__input-description">
                    {{ input.inputtiledescription }}
                  </div>
                </div>
              </div>
            </div>
          </draggable>
        </div>
        <div class="hrbr-agreement-editor-inputs__inputs-not-found" v-else>Fields not found</div>
      </div>
    </div>
  </div>
</template>

<style>
#hrbr-agreement-editor-inputs.hrbr-agreement-editor-inputs {
  display: grid;
  grid-template-rows: auto 1fr;
}

#hrbr-agreement-editor-inputs .hrbr-agreement-editor-inputs__head {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 15px 20px;
  border-bottom: 1px solid #ececec;
  min-width: 0;
}

#hrbr-agreement-editor-inputs .hrbr-agreement-editor-inputs__body {
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr);
}

#hrbr-agreement-editor-inputs .hrbr-agreement-editor-inputs__signers-dropdown.is-active .hrbr-agreement-editor-inputs__signers-dropdown-trigger {
  position: relative;
}

#hrbr-agreement-editor-inputs .hrbr-agreement-editor-inputs__signers-dropdown-container {
  position: relative;
}

#hrbr-agreement-editor-inputs .hrbr-agreement-editor-inputs__signers-dropdown-label {
  font-size: 12px;
  line-height: 1.2;
  position: absolute;
  left: 5px;
  bottom: calc(100% - 6px);
  background: #fff;
  padding: 0px 5px;
  z-index: 1;
}

#hrbr-agreement-editor-inputs .hrbr-agreement-editor-inputs-dropdown {
  font-size: 16px;
  display: flex;
  position: relative;
  width: 100%;
  user-select: none;
}

#hrbr-agreement-editor-inputs .hrbr-agreement-editor-inputs-dropdown__selected {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 40px;
  padding: 5px 12px;
  border-radius: 4px;
  background: #fff;
  border: 1px solid #DBDBDB;
  transition: all 0.2s;
}

#hrbr-agreement-editor-inputs .hrbr-agreement-editor-inputs-dropdown__selected:hover {
  border-color: #b5b5b5;
}

#hrbr-agreement-editor-inputs .hrbr-agreement-editor-inputs-dropdown__signers-dropdown-selected-value {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

#hrbr-agreement-editor-inputs .hrbr-agreement-editor-inputs-dropdown__signers-dropdown-selected-color {
  display: block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #fff;
  flex-shrink: 0;
}

#hrbr-agreement-editor-inputs .hrbr-agreement-editor-inputs-dropdown__menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  width: 100%;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0px 2px 4px 0px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  user-select: none;
  z-index: 10;
}

#hrbr-agreement-editor-inputs .hrbr-agreement-editor-inputs-dropdown__menu-wrapper {
  height: 200px;
  overflow-y: auto;
}

#hrbr-agreement-editor-inputs .hrbr-agreement-editor-inputs-dropdown__list {
  padding-bottom: 8px;
}

#hrbr-agreement-editor-inputs .hrbr-agreement-editor-inputs-dropdown__list-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  cursor: pointer;
}

#hrbr-agreement-editor-inputs .hrbr-agreement-editor-inputs-dropdown__list-item:hover,
#hrbr-agreement-editor-inputs .hrbr-agreement-editor-inputs-dropdown__list-item.is-active {
  background-color: rgb(228 233 236 / 40%);
}

#hrbr-agreement-editor-inputs .hrbr-agreement-editor-inputs-dropdown__list-item-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

#hrbr-agreement-editor-inputs .hrbr-agreement-editor-inputs__groups {
  padding: 20px 0;
  border-right: 1px solid #ececec;
}

#hrbr-agreement-editor-inputs .hrbr-agreement-editor-inputs__groups-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

#hrbr-agreement-editor-inputs .hrbr-agreement-editor-inputs__group {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  background: transparent;
  border-radius: 5px;
  position: relative;
  transition: all 0.3s ease;
  cursor: pointer;
}

#hrbr-agreement-editor-inputs .hrbr-agreement-editor-inputs__group--active,
#hrbr-agreement-editor-inputs .hrbr-agreement-editor-inputs__group:hover {
  background: #eee;
}

#hrbr-agreement-editor-inputs .hrbr-agreement-editor-inputs__group-icon {
  font-size: 21px;
  line-height: 1;
  color: var(--main-primary-color-activefocus);
  transition: all 0.15s ease;
}

#hrbr-agreement-editor-inputs .hrbr-agreement-editor-inputs__group-title {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  height: 30px;
  padding: 0 10px;
  position: absolute;
  left: calc(100% + 5px);
  top: 0;
  bottom: 0;
  margin: auto;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.2);
  visibility: hidden;
  opacity: 0;
  transform: translateX(-10px);
  transition: opacity 0.15s ease, visibility 0.15s ease, transform 0.3s ease;
  will-change: opacity, visibility, transform;
  pointer-events: none;
  user-select: none;
  z-index: 1;
}

#hrbr-agreement-editor-inputs .hrbr-agreement-editor-inputs__group-title-text {
  font-size: 15px;
  line-height: 1.2;
  text-align: center;
  white-space: nowrap;
}

#hrbr-agreement-editor-inputs .hrbr-agreement-editor-inputs__group:hover .hrbr-agreement-editor-inputs__group-title {
  visibility: visible;
  opacity: 1;
  transform: translateX(0);
}

#hrbr-agreement-editor-inputs .hrbr-agreement-editor-inputs__inputs {
  padding: 20px;
}

#hrbr-agreement-editor-inputs .hrbr-agreement-editor-inputs__input {
  display: flex;
  min-height: 56px;
  background: #fff;
  border: 1px solid #dbdbdb;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
  user-select: none;
  cursor: grab;
  margin-bottom: 10px;
}

#hrbr-agreement-editor-inputs .sortable-fallback {
  border-color: #1f89c7 !important;
}

#hrbr-agreement-editor-inputs .hrbr-agreement-editor-inputs__input:hover {
  border-color: #1f89c7;
}


#hrbr-agreement-editor-inputs .hrbr-agreement-editor-inputs__input:hover .hrbr-agreement-editor-inputs__input-wrap {
  background: rgba(31, 137, 199, 0.2);
}

#hrbr-agreement-editor-inputs .hrbr-agreement-editor-inputs__input:last-child {
  margin-bottom: 0;
}

#hrbr-agreement-editor-inputs .hrbr-agreement-editor-inputs__input-drag {
  font-size: 15px;
  color: #7b7b7b;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 12px;
  background: #dbdbdb;
  transition: all 0.2s ease;
  position: relative;
}

#hrbr-agreement-editor-inputs .hrbr-agreement-editor-inputs__input-wrap {
  display: flex;
  flex: 1;
  min-width: 0;
  transition: all 0.2s ease;
}

#hrbr-agreement-editor-inputs .hrbr-agreement-editor-inputs__input-icon {
  display: flex;
  justify-content: center;
  flex-shrink: 0;
  width: 40px;
  padding: 8px 0;
}

#hrbr-agreement-editor-inputs .hrbr-agreement-editor-inputs__input-icon i {
  font-size: 20px;
  color: #1f89c7;
  width: 30px;
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
}

#hrbr-agreement-editor-inputs .hrbr-agreement-editor-inputs__input-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 8px 5px 8px 0;
  min-width: 0;
}

#hrbr-agreement-editor-inputs .hrbr-agreement-editor-inputs__input-title {
  font-size: 15px;
  color: #333;
  line-height: 1.2;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

#hrbr-agreement-editor-inputs .hrbr-agreement-editor-inputs__input-description {
  font-size: 12px;
  color: #8b8b8b;
  line-height: 1.2;
  margin-top: 4px;
}
</style>
