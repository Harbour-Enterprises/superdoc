import { getMarkType } from './getMarkType.js'

export function getMarkAttributes(state, typeOrName){
  const type = getMarkType(typeOrName, state.schema)
  const { from, to, empty } = state.selection
  const marks = []

  if (empty) {
    if (state.storedMarks) {
      marks.push(...state.storedMarks)
    }

    marks.push(...state.selection.$head.marks())
  } else {
    state.doc.nodesBetween(from, to, node => {
      marks.push(...node.marks)
    })
  }

  const mark = marks.find(markItem => markItem.type.name === type.name)

  if (!mark) {
    return {}
  }

  return { ...mark.attrs }
}
