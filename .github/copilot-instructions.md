# GitHub Copilot Workspace Instructions

This workspace includes custom skills and commands for enhanced development.

## Frontend Design Skill

When building frontend components, pages, or applications, follow these guidelines:

### Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.

### Frontend Aesthetics Guidelines

Focus on:
- **Typography**: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices. Pair a distinctive display font with a refined body font.
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
- **Motion**: Use animations for effects and micro-interactions. Focus on high-impact moments: one well-orchestrated page load with staggered reveals creates more delight than scattered micro-interactions.
- **Spatial Composition**: Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density.
- **Backgrounds & Visual Details**: Create atmosphere and depth rather than defaulting to solid colors. Add contextual effects and textures like gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows.

NEVER use generic AI-generated aesthetics like overused font families (Inter, Roboto, Arial), cliched color schemes (purple gradients on white), predictable layouts, and cookie-cutter design.

**IMPORTANT**: Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations. Minimalist designs need restraint, precision, and careful attention to spacing and typography.

## Code Review Guidelines

When reviewing code or pull requests:

1. Focus on HIGH SIGNAL issues only:
   - Code that will fail to compile or parse
   - Clear logic errors that will produce wrong results
   - Security issues and incorrect logic
   
2. Do NOT flag:
   - Code style or quality concerns
   - Pedantic nitpicks
   - Issues that linters will catch
   - Pre-existing issues not introduced in the change

3. When providing feedback:
   - Cite specific lines with context
   - For small fixes, provide committable suggestions
   - For larger changes, describe the issue and suggested approach
   - Link to relevant documentation or guidelines
