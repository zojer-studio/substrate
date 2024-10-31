---
title: Citation
tags:
  - feature/transformer
---

Quartz uses [rehype-citation](https://github.com/timlrx/rehype-citation) to support parsing biblography file.

An example of a citation as below:

> [@templeton2024scaling] showed that features are generally interpretable and monosemantic, and many are safety-relevant.

> [!tip]- Syntax
>
> See [source](https://github.com/jackyzha0/quartz/blob/v4/docs/features/Citations.md) and [biblography example](https://github.com/jackyzha0/quartz/blob/v4/docs/biblography.bib)

> [!note] Behaviour of references
>
> By default, the references will be included at the end of the file. To control where the references to be included,uses `[^ref]`

## Customization

Citation parsing is a functionality of the [[plugins/Citations|Citation]] plugin. See the plugin page for customization options.

## References

[^ref]
