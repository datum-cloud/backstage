import {
  createFrontendModule,
  createTranslationMessages,
} from '@backstage/frontend-plugin-api';
import { TranslationBlueprint } from '@backstage/plugin-app-react';
import { catalogTranslationRef } from '@backstage/plugin-catalog';
import { catalogReactTranslationRef } from '@backstage/plugin-catalog-react';
import { orgTranslationRef } from '@backstage/plugin-org';

const catalogVocabulary = TranslationBlueprint.make({
  name: 'catalog-vocabulary',
  params: {
    resource: createTranslationMessages({
      ref: catalogTranslationRef,
      messages: {
        'aboutCard.ownerField.label': 'Team',
        'aboutCard.ownerField.value': 'No team',
        'aboutCard.systemField.label': 'Service',
        'aboutCard.systemField.value': 'No service',
        'entityLabels.ownerLabel': 'Team',
        'searchResultItem.owner': 'Team',
        'hasComponentsCard.emptyMessage':
          'No component is part of this service.',
        'hasResourcesCard.emptyMessage': 'No resource is part of this service.',
        'hasSystemsCard.title': 'Has services',
        'hasSystemsCard.emptyMessage': 'No service is part of this domain.',
        'systemDiagramCard.title': 'Service diagram',
      },
    }),
  },
});

const catalogReactVocabulary = TranslationBlueprint.make({
  name: 'catalog-react-vocabulary',
  params: {
    resource: createTranslationMessages({
      ref: catalogReactTranslationRef,
      messages: {
        'entityOwnerPicker.title': 'Team',
        'entityTableColumnTitle.system': 'Service',
        'entityTableColumnTitle.owner': 'Team',
      },
    }),
  },
});

const orgVocabulary = TranslationBlueprint.make({
  name: 'org-vocabulary',
  params: {
    resource: createTranslationMessages({
      ref: orgTranslationRef,
      messages: {
        'groupProfileCard.groupNotFound': 'Team not found',
        'groupProfileCard.listItemTitle.parentGroup': 'Parent team',
        'groupProfileCard.listItemTitle.childGroups': 'Child teams',
        'membersListCard.noMembersDescription': 'This team has no members.',
        'membersListCard.aggregateMembersToggle.label': 'Include sub-teams',
        'userProfileCard.allGroupDialog.title': "All {{name}}'s teams:",
      },
    }),
  },
});

export const i18nModule = createFrontendModule({
  pluginId: 'app',
  extensions: [catalogVocabulary, catalogReactVocabulary, orgVocabulary],
});
