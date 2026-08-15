import re

path = 'src/components/LivePlayer.tsx'
with open(path, 'r') as f:
    content = f.read()

# We want to replace the `glass-panel` div that contains the radial timer.
# It starts at: `<div className="glass-panel" style={{` immediately after `onTouchEnd={onTouchEndHandler}`
# It ends at: `</div>` right before `{/* Globally Visible Shared Bottom Controls`

start_marker = '<div className="glass-panel" style={{'
end_marker = '{/* Globally Visible Shared Bottom Controls'

start_idx = content.find(start_marker, content.find('onTouchEnd={onTouchEndHandler}'))

# Find the end of this glass-panel div
# It should be the last `</div>` before `end_marker`
end_idx = content.find(end_marker, start_idx)

# Find the last `</div>` before `end_idx`
last_div_idx = content.rfind('</div>', start_idx, end_idx)
# We also want to include the whitespace after it so we don't mess up formatting
# but wait, there might be multiple `</div>`s. Let's just grab the whole block and do a robust replacement.

block_to_replace = content[start_idx:last_div_idx + 6]

new_block = """<div style={{
          display: 'flex',
          width: `${allExercises.length * 100}%`,
          transform: `translateX(-${(currentIndex / allExercises.length) * 100}%)`,
          transition: 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}>
          {allExercises.map((carouselItem, idx) => {
            const isThisActive = idx === currentIndex;
            const itemTimeLeft = isThisActive ? timeLeft : (carouselItem.exercise.durationSeconds || 180);
            const itemProgressPercent = isThisActive ? progressPercent : 100;
            const itemIsResting = isThisActive ? isResting : false;

            return (
              <div key={idx} style={{ 
                width: `${100 / allExercises.length}%`, 
                padding: '0 8px',
                pointerEvents: isThisActive ? 'auto' : 'none',
                opacity: isThisActive ? 1 : 0.4,
                transition: 'opacity 0.3s ease'
              }}>
""" + block_to_replace + """
              </div>
            );
          })}
        </div>"""

# Replace `currentExercise` with `carouselItem.exercise`
new_block = new_block.replace('currentExercise', 'carouselItem.exercise')
new_block = new_block.replace('timeLeft', 'itemTimeLeft')
new_block = new_block.replace('progressPercent', 'itemProgressPercent')
new_block = new_block.replace('isResting', 'itemIsResting')
new_block = new_block.replace('currentItem.blockBadgeColor', 'allExercises[idx].blockBadgeColor')

# Wait! The original code used `setPreviewIndex(currentIndex)`.
# After replacement, it will be `setPreviewIndex(carouselItem.exercise)`. But we want `setPreviewIndex(idx)`.
new_block = new_block.replace('setPreviewIndex(currentIndex)', 'setPreviewIndex(idx)')

# Wait! If I replaced `timeLeft`, it might replace `itemTimeLeft` too. Let's be careful.
# My new block already has `itemTimeLeft = isThisActive ? timeLeft : ...`. So replacing `timeLeft` with `itemTimeLeft` will turn `itemTimeLeft` into `itemitemTimeLeft`!
# Let me fix that.

# Better: Just replace inside `block_to_replace`!

modified_inner_block = block_to_replace.replace('currentExercise', 'carouselItem.exercise')
modified_inner_block = modified_inner_block.replace('timeLeft', 'itemTimeLeft')
modified_inner_block = modified_inner_block.replace('progressPercent', 'itemProgressPercent')
modified_inner_block = modified_inner_block.replace('isResting ?', 'itemIsResting ?')
modified_inner_block = modified_inner_block.replace('isResting)', 'itemIsResting)')
modified_inner_block = modified_inner_block.replace('currentItem.blockBadgeColor', 'carouselItem.blockBadgeColor')
modified_inner_block = modified_inner_block.replace('setPreviewIndex(currentIndex)', 'setPreviewIndex(idx)')

final_new_block = """<div style={{
          display: 'flex',
          width: `${allExercises.length * 100}%`,
          transform: `translateX(-${(currentIndex / allExercises.length) * 100}%)`,
          transition: 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}>
          {allExercises.map((carouselItem, idx) => {
            const isThisActive = idx === currentIndex;
            const itemTimeLeft = isThisActive ? timeLeft : (carouselItem.exercise.durationSeconds || 180);
            const itemProgressPercent = isThisActive ? progressPercent : 100;
            const itemIsResting = isThisActive ? isResting : false;

            return (
              <div key={idx} style={{ 
                width: `${100 / allExercises.length}%`, 
                padding: '0 8px',
                pointerEvents: isThisActive ? 'auto' : 'none',
                opacity: isThisActive ? 1 : 0.4,
                transition: 'opacity 0.3s ease'
              }}>
""" + modified_inner_block + """
              </div>
            );
          })}
        </div>"""

new_content = content[:start_idx] + final_new_block + content[last_div_idx + 6:]

with open(path, 'w') as f:
    f.write(new_content)
