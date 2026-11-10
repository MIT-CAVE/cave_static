import { MenuItem, MenuList } from '@mui/material'
import { expect, userEvent, waitFor, within } from 'storybook/test'

import RichLabel from '../../ui/compound/RichLabel'
import SelectAccordion from '../../ui/compound/SelectAccordion'

const richLabelSpacingStories = {
  title: 'Compound/RichText/Spacing',
  parameters: { layoutWidth: '400px', layoutHeight: '300px' },
}

export default richLabelSpacingStories

// A flex container makes the text and the elements of a label separate items,
// which drops the spaces between them (`_Cost_ per unit` is shown as
// "Costper unit"). Labels are a single child, so they keep their spaces
const expectSpaceAfterEm = async (container) => {
  const em = await waitFor(() => {
    const found = container.querySelector('em')
    expect(found).not.toBeNull()
    return found
  })
  const text = em.nextSibling
  const range = document.createRange()
  // The range starts at the first letter, as the space itself has no gap
  range.setStart(text, text.textContent.search(/\S/))
  range.setEnd(text, text.textContent.length)
  const gap =
    range.getBoundingClientRect().left - em.getBoundingClientRect().right
  await expect(gap).toBeGreaterThan(1)
}

export const FlexContainer = {
  render: () => (
    <div data-testid="flex" style={{ display: 'flex' }}>
      <RichLabel text="_Cost_ per unit" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expectSpaceAfterEm(canvasElement)
  },
}

export const MenuItemInSelectAccordion = {
  render: () => (
    <SelectAccordion
      values=""
      placeholder="Group By"
      itemGroups={{
        null: [
          {
            id: 'location',
            layoutDirection: 'horizontal',
            subItems: ['state'],
          },
        ],
      }}
      getLabel={(item) => item}
      getSubLabel={() => '_State_ level'}
      richText
    />
  ),
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole('combobox'))
    await expectSpaceAfterEm(canvasElement.ownerDocument.body)
  },
}

export const MenuListItem = {
  render: () => (
    <MenuList>
      <MenuItem>
        <RichLabel text="_Cost_ per unit" />
      </MenuItem>
    </MenuList>
  ),
  play: async ({ canvasElement }) => {
    await expectSpaceAfterEm(canvasElement)
  },
}
