import Storex from '@worldbrain/storex'
import { normalizeUrl } from '@worldbrain/memex-url-utils'

import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'
import { generateTemplateDocs } from './template-doc-generation'
import * as DATA from './template-doc-generation.test.data'
import { getTemplateDataFetchers } from './background'
import { joinTags } from './utils'

async function insertTestData(storageManager: Storex) {
    await storageManager.collection('pages').createObject(DATA.testPageA)
    await storageManager.collection('pages').createObject(DATA.testPageB)
    await storageManager.collection('annotations').createObject({
        url: DATA.testAnnotationAUrl,
        comment: DATA.testAnnotationAText,
    })

    await storageManager.collection('annotations').createObject({
        url: DATA.testAnnotationBUrl,
        body: DATA.testAnnotationBHighlight,
    })

    const insertTags = (url: string, tags: string[]) =>
        Promise.all(
            tags.map((name) =>
                storageManager.collection('tags').createObject({ url, name }),
            ),
        )

    await insertTags(normalizeUrl(DATA.testPageAUrl), DATA.testPageATags)
    await insertTags(normalizeUrl(DATA.testPageBUrl), DATA.testPageBTags)
    await insertTags(DATA.testAnnotationAUrl, DATA.testAnnotationATags)
    await insertTags(DATA.testAnnotationBUrl, DATA.testAnnotationBTags)
}

async function setupTest() {
    const {
        backgroundModules,
        storageManager,
    } = await setupBackgroundIntegrationTest()

    await insertTestData(storageManager)

    return {
        backgroundModules,
        storageManager,
        dataFetchers: getTemplateDataFetchers({ storageManager }),
    }
}

describe('Content template doc generation', () => {
    const testTemplate = { isFavourite: false, title: 'test', id: -1 }

    it('should correctly generate template docs for a single page', async () => {
        const { dataFetchers } = await setupTest()

        expect(
            await generateTemplateDocs({
                template: { ...testTemplate, code: '{{{PageTitle}}}' },
                normalizedPageUrls: [DATA.testPageA.url],
                annotationUrls: [],
                dataFetchers,
            }),
        ).toEqual([
            {
                PageTitle: DATA.testPageA.fullTitle,
                PageUrl: DATA.testPageAUrl,
                PageTags: joinTags(DATA.testPageATags),
                PageTagList: DATA.testPageATags,
                title: DATA.testPageA.fullTitle,
                url: DATA.testPageAUrl,
                tags: DATA.testPageATags,
            },
        ])
    })

    it('should correctly generate template docs for a single page, including a page link', async () => {
        const { dataFetchers } = await setupTest()

        expect(
            await generateTemplateDocs({
                template: {
                    ...testTemplate,
                    code: '{{{PageTitle}}} {{{PageLink}}}',
                },
                normalizedPageUrls: [DATA.testPageA.url],
                annotationUrls: [],
                dataFetchers,
            }),
        ).toEqual([
            {
                PageLink: expect.any(String), // TODO: properly set once implemented
                PageTitle: DATA.testPageA.fullTitle,
                PageUrl: DATA.testPageAUrl,
                PageTags: joinTags(DATA.testPageATags),
                PageTagList: DATA.testPageATags,
                title: DATA.testPageA.fullTitle,
                url: DATA.testPageAUrl,
                tags: DATA.testPageATags,
            },
        ])
    })

    it('should correctly generate template docs for multiple pages', async () => {
        const { dataFetchers } = await setupTest()

        // TODO: this case is not yet supported, but likely to be in the future
        // expect(
        //     await generateTemplateDocs({
        //         template: {
        //             ...testTemplate,
        //             code: '{{#Pages}}{{{PageTitle}}}{{/Pages}}',
        //         },
        //         normalizedPageUrls: [DATA.testPageA.url, DATA.testPageB.url],
        //         annotationUrls: [],
        //         dataFetchers,
        //     }),
        // ).toEqual([
        //     {
        //         Pages: [
        //             {
        //                 PageTitle: DATA.testPageA.fullTitle,
        //                 PageTags: joinTags(DATA.testPageATags),
        //                 PageTagList: DATA.testPageATags,
        //                 PageUrl: DATA.testPageAUrl,
        //                 title: DATA.testPageA.fullTitle,
        //                 tags: DATA.testPageATags,
        //                 url: DATA.testPageAUrl,
        //             },
        //             {
        //                 PageTitle: DATA.testPageB.fullTitle,
        //                 PageTags: joinTags(DATA.testPageBTags),
        //                 PageTagList: DATA.testPageBTags,
        //                 PageUrl: DATA.testPageBUrl,
        //                 title: DATA.testPageB.fullTitle,
        //                 tags: DATA.testPageBTags,
        //                 url: DATA.testPageBUrl,
        //             },
        //         ],
        //     },
        // ])

        expect(
            await generateTemplateDocs({
                template: {
                    ...testTemplate,
                    code: '{{{PageTitle}}}',
                },
                normalizedPageUrls: [DATA.testPageA.url, DATA.testPageB.url],
                annotationUrls: [],
                dataFetchers,
            }),
        ).toEqual([
            {
                PageTitle: DATA.testPageA.fullTitle,
                PageTags: joinTags(DATA.testPageATags),
                PageTagList: DATA.testPageATags,
                PageUrl: DATA.testPageAUrl,
                title: DATA.testPageA.fullTitle,
                tags: DATA.testPageATags,
                url: DATA.testPageAUrl,
            },
            {
                PageTitle: DATA.testPageB.fullTitle,
                PageTags: joinTags(DATA.testPageBTags),
                PageTagList: DATA.testPageBTags,
                PageUrl: DATA.testPageBUrl,
                title: DATA.testPageB.fullTitle,
                tags: DATA.testPageBTags,
                url: DATA.testPageBUrl,
            },
        ])
    })

    it('should correctly generate template docs for single annotation, but only with page references', async () => {
        const { dataFetchers } = await setupTest()

        expect(
            await generateTemplateDocs({
                template: { ...testTemplate, code: '{{{PageTitle}}}' },
                normalizedPageUrls: [DATA.testPageA.url],
                annotationUrls: [DATA.testAnnotationAUrl],
                dataFetchers,
            }),
        ).toEqual([
            {
                PageTitle: DATA.testPageA.fullTitle,
                PageUrl: DATA.testPageAUrl,
                title: DATA.testPageA.fullTitle,
                url: DATA.testPageAUrl,
            },
        ])

        expect(
            await generateTemplateDocs({
                template: {
                    ...testTemplate,
                    code: '{{{PageTitle}}} {{{PageTags}}}',
                },
                normalizedPageUrls: [DATA.testPageA.url],
                annotationUrls: [DATA.testAnnotationAUrl],
                dataFetchers,
            }),
        ).toEqual([
            {
                PageTitle: DATA.testPageA.fullTitle,
                PageTags: joinTags(DATA.testPageATags),
                PageTagList: DATA.testPageATags,
                PageUrl: DATA.testPageAUrl,
                title: DATA.testPageA.fullTitle,
                tags: DATA.testPageATags,
                url: DATA.testPageAUrl,
            },
        ])

        expect(
            await generateTemplateDocs({
                template: {
                    ...testTemplate,
                    code: '{{{PageTitle}}} {{{PageTags}}} {{{PageLink}}}',
                },
                normalizedPageUrls: [DATA.testPageA.url],
                annotationUrls: [DATA.testAnnotationAUrl],
                dataFetchers,
            }),
        ).toEqual([
            {
                PageTitle: DATA.testPageA.fullTitle,
                PageTags: joinTags(DATA.testPageATags),
                PageTagList: DATA.testPageATags,
                PageUrl: DATA.testPageAUrl,
                PageLink: expect.any(String), // TODO: properly set once implemented
                title: DATA.testPageA.fullTitle,
                tags: DATA.testPageATags,
                url: DATA.testPageAUrl,
            },
        ])
    })

    it('should correctly generate template docs for single annotation', async () => {
        const { dataFetchers } = await setupTest()

        const generate = (template: string) =>
            generateTemplateDocs({
                template: { ...testTemplate, code: template },
                normalizedPageUrls: [DATA.testPageA.url],
                annotationUrls: [DATA.testAnnotationAUrl],
                dataFetchers,
            })

        expect(await generate('{{{NoteText}}}')).toEqual([
            {
                NoteText: DATA.testAnnotationAText,
            },
        ])

        expect(await generate('{{{NoteText}}} {{{PageTitle}}}')).toEqual([
            {
                PageTitle: DATA.testPageA.fullTitle,
                PageUrl: DATA.testPageAUrl,
                title: DATA.testPageA.fullTitle,
                url: DATA.testPageAUrl,
                NoteText: DATA.testAnnotationAText,
            },
        ])

        expect(
            await generate('{{{NoteText}}} {{{NoteTags}}} {{{PageTitle}}}'),
        ).toEqual([
            {
                PageTitle: DATA.testPageA.fullTitle,
                PageUrl: DATA.testPageAUrl,
                NoteText: DATA.testAnnotationAText,
                NoteTags: joinTags(DATA.testAnnotationATags),
                NoteTagList: DATA.testAnnotationATags,
                title: DATA.testPageA.fullTitle,
                url: DATA.testPageAUrl,
            },
        ])

        expect(
            await generate('{{{NoteText}}} {{{PageTitle}}} {{{PageTags}}}'),
        ).toEqual([
            {
                PageTitle: DATA.testPageA.fullTitle,
                PageUrl: DATA.testPageAUrl,
                PageTags: joinTags(DATA.testPageATags),
                PageTagList: DATA.testPageATags,
                NoteText: DATA.testAnnotationAText,
                title: DATA.testPageA.fullTitle,
                url: DATA.testPageAUrl,
                tags: DATA.testPageATags,
            },
        ])

        expect(
            await generate(
                '{{{NoteText}}} {{{NoteTags}}} {{{PageTitle}}} {{{PageTags}}}',
            ),
        ).toEqual([
            {
                PageTitle: DATA.testPageA.fullTitle,
                PageUrl: DATA.testPageAUrl,
                PageTags: joinTags(DATA.testPageATags),
                PageTagList: DATA.testPageATags,
                NoteText: DATA.testAnnotationAText,
                NoteTags: joinTags(DATA.testAnnotationATags),
                NoteTagList: DATA.testAnnotationATags,
                title: DATA.testPageA.fullTitle,
                url: DATA.testPageAUrl,
                tags: DATA.testPageATags,
            },
        ])
    })

    it('should correctly generate template docs for single annotation, with a note link', async () => {
        const { dataFetchers } = await setupTest()

        expect(
            await generateTemplateDocs({
                template: {
                    ...testTemplate,
                    code: '{{{NoteText}}} {{{NoteLink}}}',
                },
                normalizedPageUrls: [DATA.testPageA.url],
                annotationUrls: [DATA.testAnnotationAUrl],
                dataFetchers,
            }),
        ).toEqual([
            {
                NoteText: DATA.testAnnotationAText,
                NoteLink: expect.any(String), // TODO: properly set once implemented
            },
        ])
    })

    it('should correctly generate template docs for single annotation, but iterating through the notes array', async () => {
        const { dataFetchers } = await setupTest()

        expect(
            await generateTemplateDocs({
                template: {
                    ...testTemplate,
                    code: '{{#Notes}}{{{NoteText}}}{{/Notes}}',
                },
                normalizedPageUrls: [DATA.testPageA.url],
                annotationUrls: [DATA.testAnnotationAUrl],
                dataFetchers,
            }),
        ).toEqual([
            {
                Notes: [
                    {
                        NoteText: DATA.testAnnotationAText,
                    },
                ],
            },
        ])

        // This annot doesn't have any comment, only a highlight
        expect(
            await generateTemplateDocs({
                template: {
                    ...testTemplate,
                    code: '{{#Notes}}{{{NoteHighlight}}}{{/Notes}}',
                },
                normalizedPageUrls: [DATA.testPageA.url],
                annotationUrls: [DATA.testAnnotationBUrl],
                dataFetchers,
            }),
        ).toEqual([
            {
                Notes: [
                    {
                        NoteHighlight: DATA.testAnnotationBHighlight,
                    },
                ],
            },
        ])

        expect(
            await generateTemplateDocs({
                template: {
                    ...testTemplate,
                    code: '{{#Notes}}{{{NoteText}}} {{{NoteTags}}}{{/Notes}}',
                },
                normalizedPageUrls: [DATA.testPageA.url],
                annotationUrls: [DATA.testAnnotationAUrl],
                dataFetchers,
            }),
        ).toEqual([
            {
                Notes: [
                    {
                        NoteText: DATA.testAnnotationAText,
                        NoteTags: joinTags(DATA.testAnnotationATags),
                        NoteTagList: DATA.testAnnotationATags,
                    },
                ],
            },
        ])
    })

    it('should correctly generate template docs for multiple annotations, but only with page references', async () => {
        const { dataFetchers } = await setupTest()

        expect(
            await generateTemplateDocs({
                template: { ...testTemplate, code: '{{{PageTitle}}}' },
                normalizedPageUrls: [DATA.testPageA.url],
                annotationUrls: [
                    DATA.testAnnotationAUrl,
                    DATA.testAnnotationBUrl,
                ],
                dataFetchers,
            }),
        ).toEqual([
            {
                PageTitle: DATA.testPageA.fullTitle,
                PageUrl: DATA.testPageAUrl,

                title: DATA.testPageA.fullTitle,
                url: DATA.testPageAUrl,
            },
        ])

        expect(
            await generateTemplateDocs({
                template: {
                    ...testTemplate,
                    code: '{{{PageTitle}}} {{{PageTags}}}',
                },
                normalizedPageUrls: [DATA.testPageA.url],
                annotationUrls: [
                    DATA.testAnnotationAUrl,
                    DATA.testAnnotationBUrl,
                ],
                dataFetchers,
            }),
        ).toEqual([
            {
                PageTitle: DATA.testPageA.fullTitle,
                PageTags: joinTags(DATA.testPageATags),
                PageTagList: DATA.testPageATags,
                PageUrl: DATA.testPageAUrl,

                title: DATA.testPageA.fullTitle,
                tags: DATA.testPageATags,
                url: DATA.testPageAUrl,
            },
        ])

        expect(
            await generateTemplateDocs({
                template: {
                    ...testTemplate,
                    code: '{{{PageTitle}}} {{{PageTags}}} {{{PageLink}}}',
                },
                normalizedPageUrls: [DATA.testPageA.url],
                annotationUrls: [
                    DATA.testAnnotationAUrl,
                    DATA.testAnnotationBUrl,
                ],
                dataFetchers,
            }),
        ).toEqual([
            {
                PageTitle: DATA.testPageA.fullTitle,
                PageTags: joinTags(DATA.testPageATags),
                PageTagList: DATA.testPageATags,
                PageUrl: DATA.testPageAUrl,
                PageLink: expect.any(String), // TODO: properly set once implemented

                title: DATA.testPageA.fullTitle,
                tags: DATA.testPageATags,
                url: DATA.testPageAUrl,
            },
        ])
    })

    it('should correctly generate template docs for multiple annotations, but only referencing top-level annotation', async () => {
        const { dataFetchers } = await setupTest()

        const generate = (template: string) =>
            generateTemplateDocs({
                template: {
                    ...testTemplate,
                    code: template,
                },
                normalizedPageUrls: [DATA.testPageA.url],
                annotationUrls: [
                    DATA.testAnnotationAUrl,
                    DATA.testAnnotationBUrl,
                ],
                dataFetchers,
            })

        expect(await generate('{{{NoteText}}} {{{NoteTags}}}')).toEqual([
            {
                NoteText: DATA.testAnnotationAText,
                NoteTags: joinTags(DATA.testAnnotationATags),
                NoteTagList: DATA.testAnnotationATags,
            },
            {
                NoteHighlight: DATA.testAnnotationBHighlight,
                NoteTags: joinTags(DATA.testAnnotationBTags),
                NoteTagList: DATA.testAnnotationBTags,
            },
        ])

        expect(await generate('{{{NoteText}}}')).toEqual([
            {
                NoteText: DATA.testAnnotationAText,
            },
            {
                NoteHighlight: DATA.testAnnotationBHighlight,
            },
        ])

        expect(await generate('{{{NoteText}}} {{{PageTitle}}}')).toEqual([
            {
                NoteText: DATA.testAnnotationAText,
                PageTitle: DATA.testPageA.fullTitle,
                PageUrl: DATA.testPageAUrl,

                title: DATA.testPageA.fullTitle,
                url: DATA.testPageAUrl,
            },
            {
                NoteHighlight: DATA.testAnnotationBHighlight,
                PageTitle: DATA.testPageA.fullTitle,
                PageUrl: DATA.testPageAUrl,

                title: DATA.testPageA.fullTitle,
                url: DATA.testPageAUrl,
            },
        ])

        expect(
            await generate('{{{NoteText}}} {{{PageTitle}}} {{{PageTags}}}'),
        ).toEqual([
            {
                NoteText: DATA.testAnnotationAText,
                PageTitle: DATA.testPageA.fullTitle,
                PageTags: joinTags(DATA.testPageATags),
                PageTagList: DATA.testPageATags,
                PageUrl: DATA.testPageAUrl,

                title: DATA.testPageA.fullTitle,
                tags: DATA.testPageATags,
                url: DATA.testPageAUrl,
            },
            {
                NoteHighlight: DATA.testAnnotationBHighlight,
                PageTitle: DATA.testPageA.fullTitle,
                PageTags: joinTags(DATA.testPageATags),
                PageTagList: DATA.testPageATags,
                PageUrl: DATA.testPageAUrl,

                title: DATA.testPageA.fullTitle,
                tags: DATA.testPageATags,
                url: DATA.testPageAUrl,
            },
        ])
    })

    it('should correctly generate template docs for multiple annotations', async () => {
        const { dataFetchers } = await setupTest()

        const generate = (template: string) =>
            generateTemplateDocs({
                template: {
                    ...testTemplate,
                    code: template,
                },
                normalizedPageUrls: [DATA.testPageA.url],
                annotationUrls: [
                    DATA.testAnnotationAUrl,
                    DATA.testAnnotationBUrl,
                ],
                dataFetchers,
            })

        expect(await generate('{{#Notes}}{{{NoteText}}}{{/Notes}}')).toEqual([
            {
                Notes: [
                    {
                        NoteText: DATA.testAnnotationAText,
                    },
                    {
                        NoteHighlight: DATA.testAnnotationBHighlight,
                    },
                ],
            },
        ])

        expect(
            await generate('{{#Notes}}{{{NoteText}}} {{{NoteTags}}}{{/Notes}}'),
        ).toEqual([
            {
                Notes: [
                    {
                        NoteText: DATA.testAnnotationAText,
                        NoteTags: joinTags(DATA.testAnnotationATags),
                        NoteTagList: DATA.testAnnotationATags,
                    },
                    {
                        NoteHighlight: DATA.testAnnotationBHighlight,
                        NoteTags: joinTags(DATA.testAnnotationBTags),
                        NoteTagList: DATA.testAnnotationBTags,
                    },
                ],
            },
        ])

        expect(
            await generate(
                '{{#Notes}}{{{NoteText}}} {{{NoteTags}}}{{/Notes}} {{{PageTitle}}}',
            ),
        ).toEqual([
            {
                PageUrl: DATA.testPageAUrl,
                PageTitle: DATA.testPageA.fullTitle,
                url: DATA.testPageAUrl,
                title: DATA.testPageA.fullTitle,
                Notes: [
                    {
                        NoteText: DATA.testAnnotationAText,
                        NoteTags: joinTags(DATA.testAnnotationATags),
                        NoteTagList: DATA.testAnnotationATags,
                        PageUrl: DATA.testPageAUrl,
                        PageTitle: DATA.testPageA.fullTitle,
                        url: DATA.testPageAUrl,
                        title: DATA.testPageA.fullTitle,
                    },
                    {
                        NoteHighlight: DATA.testAnnotationBHighlight,
                        NoteTags: joinTags(DATA.testAnnotationBTags),
                        NoteTagList: DATA.testAnnotationBTags,
                        PageUrl: DATA.testPageAUrl,
                        PageTitle: DATA.testPageA.fullTitle,
                        url: DATA.testPageAUrl,
                        title: DATA.testPageA.fullTitle,
                    },
                ],
            },
        ])

        expect(
            await generate(
                '{{#Notes}}{{{NoteText}}} {{{NoteTags}}}{{/Notes}} {{{PageTitle}}} {{{PageTags}}}',
            ),
        ).toEqual([
            {
                PageUrl: DATA.testPageAUrl,
                PageTitle: DATA.testPageA.fullTitle,
                PageTags: joinTags(DATA.testPageATags),
                PageTagList: DATA.testPageATags,
                url: DATA.testPageAUrl,
                tags: DATA.testPageATags,
                title: DATA.testPageA.fullTitle,
                Notes: [
                    {
                        NoteText: DATA.testAnnotationAText,
                        NoteTags: joinTags(DATA.testAnnotationATags),
                        NoteTagList: DATA.testAnnotationATags,
                        PageUrl: DATA.testPageAUrl,
                        PageTitle: DATA.testPageA.fullTitle,
                        PageTags: joinTags(DATA.testPageATags),
                        PageTagList: DATA.testPageATags,
                        url: DATA.testPageAUrl,
                        tags: DATA.testPageATags,
                        title: DATA.testPageA.fullTitle,
                    },
                    {
                        NoteHighlight: DATA.testAnnotationBHighlight,
                        NoteTags: joinTags(DATA.testAnnotationBTags),
                        NoteTagList: DATA.testAnnotationBTags,
                        PageUrl: DATA.testPageAUrl,
                        PageTitle: DATA.testPageA.fullTitle,
                        PageTags: joinTags(DATA.testPageATags),
                        PageTagList: DATA.testPageATags,
                        url: DATA.testPageAUrl,
                        tags: DATA.testPageATags,
                        title: DATA.testPageA.fullTitle,
                    },
                ],
            },
        ])
    })

    it('should correctly generate template docs for multiple annotations, with links', async () => {
        const { dataFetchers } = await setupTest()

        const generate = (template: string) =>
            generateTemplateDocs({
                template: {
                    ...testTemplate,
                    code: template,
                },
                normalizedPageUrls: [DATA.testPageA.url],
                annotationUrls: [
                    DATA.testAnnotationAUrl,
                    DATA.testAnnotationBUrl,
                ],
                dataFetchers,
            })

        expect(
            await generate('{{#Notes}}{{{NoteText}}} {{{NoteLink}}}{{/Notes}}'),
        ).toEqual([
            {
                Notes: [
                    {
                        NoteText: DATA.testAnnotationAText,
                        NoteLink: expect.any(String), // TODO: properly set once implemented
                    },
                    {
                        NoteHighlight: DATA.testAnnotationBHighlight,
                        NoteLink: expect.any(String), // TODO: properly set once implemented
                    },
                ],
            },
        ])

        expect(await generate('{{{PageLink}}} {{{PageTitle}}}')).toEqual([
            {
                PageUrl: DATA.testPageAUrl,
                PageTitle: DATA.testPageA.fullTitle,
                PageLink: expect.any(String), // TODO: properly set once implemented
                url: DATA.testPageAUrl,
                title: DATA.testPageA.fullTitle,
            },
        ])

        expect(
            await generate(
                '{{#Notes}}{{{NoteText}}} {{{NoteLink}}}{{/Notes}} {{{PageLink}}} {{{PageTitle}}}',
            ),
        ).toEqual([
            {
                PageUrl: DATA.testPageAUrl,
                PageTitle: DATA.testPageA.fullTitle,
                PageLink: expect.any(String), // TODO: properly set once implemented
                url: DATA.testPageAUrl,
                title: DATA.testPageA.fullTitle,
                Notes: [
                    {
                        NoteText: DATA.testAnnotationAText,
                        NoteLink: expect.any(String), // TODO: properly set once implemented
                        PageUrl: DATA.testPageAUrl,
                        PageTitle: DATA.testPageA.fullTitle,
                        PageLink: expect.any(String), // TODO: properly set once implemented
                        url: DATA.testPageAUrl,
                        title: DATA.testPageA.fullTitle,
                    },
                    {
                        NoteHighlight: DATA.testAnnotationBHighlight,
                        NoteLink: expect.any(String), // TODO: properly set once implemented
                        PageUrl: DATA.testPageAUrl,
                        PageTitle: DATA.testPageA.fullTitle,
                        PageLink: expect.any(String), // TODO: properly set once implemented
                        url: DATA.testPageAUrl,
                        title: DATA.testPageA.fullTitle,
                    },
                ],
            },
        ])
    })
})
