import re

path = 'src/components/LivePlayer.tsx'
with open(path, 'r') as f:
    content = f.read()

# 1. Add refs
refs_marker = "const carouselRefs = useRef<(HTMLButtonElement | null)[]>([]);"
new_refs = """const carouselRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const mainCarouselContainerRef = useRef<HTMLDivElement | null>(null);
  const mainCarouselItemRefs = useRef<(HTMLDivElement | null)[]>([]);"""

content = content.replace(refs_marker, new_refs)

# 2. Add Intersection Observer Effect
observer_effect = """

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'));
            if (index !== currentIndexRef.current && !isNaN(index)) {
              navigateToExercise(index);
            }
          }
        });
      },
      {
        root: mainCarouselContainerRef.current,
        threshold: 0.85,
      }
    );

    const currentRefs = mainCarouselItemRefs.current;
    currentRefs.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      currentRefs.forEach((el) => {
        if (el) observer.unobserve(el);
      });
      observer.disconnect();
    };
  }, []);
"""
content = content.replace('}, [currentIndex]);\n\n  const carouselRefs', '}, [currentIndex]);\n' + observer_effect + '\n  const carouselRefs')

# 3. Update the useEffect for scrolling
scroll_effect_marker = """    // Scroll carousel active item into view
    if (carouselRefs.current[currentIndex] && typeof carouselRefs.current[currentIndex]?.scrollIntoView === 'function') {
      carouselRefs.current[currentIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [currentIndex]);"""

new_scroll_effect = """    // Scroll carousel active item into view
    if (carouselRefs.current[currentIndex] && typeof carouselRefs.current[currentIndex]?.scrollIntoView === 'function') {
      carouselRefs.current[currentIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
    // Scroll main carousel into view
    if (mainCarouselItemRefs.current[currentIndex] && typeof mainCarouselItemRefs.current[currentIndex]?.scrollIntoView === 'function') {
      mainCarouselItemRefs.current[currentIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [currentIndex]);"""

content = content.replace(scroll_effect_marker, new_scroll_effect)

# 4. Remove custom swipe handlers EXACT MATCH
handlers_to_remove = """  const onTouchStartHandler = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMoveHandler = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentIndex < allExercises.length - 1) {
      navigateToExercise(currentIndex + 1);
    } else if (isRightSwipe && currentIndex > 0) {
      navigateToExercise(currentIndex - 1);
    }
  };
"""
content = content.replace(handlers_to_remove, '')

# Wait! The touch state variables are now unused: `touchStart`, `touchEnd`, `minSwipeDistance`
state_vars_to_remove = """  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;"""
content = content.replace(state_vars_to_remove, '')

# 5. Modify the Main Carousel DOM
old_carousel_container = """      {/* Radial Timer & Controls */}
      <div 
        style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden', margin: '0 -8px' }}
        onTouchStart={onTouchStartHandler}
        onTouchMove={onTouchMoveHandler}
        onTouchEnd={onTouchEndHandler}
      >
        <div style={{
          display: 'flex',
          width: `${allExercises.length * 100}%`,
          transform: `translateX(-${(currentIndex / allExercises.length) * 100}%)`,
          transition: 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}>"""

new_carousel_container = """      {/* Radial Timer & Controls Carousel */}
      <div 
        ref={mainCarouselContainerRef}
        style={{ 
          display: 'flex', 
          overflowX: 'auto', 
          overflowY: 'hidden',
          scrollSnapType: 'x mandatory',
          margin: '0 -16px', 
          padding: '0 16px',
          scrollBehavior: 'smooth'
        }}
        className="hide-scrollbar"
      >"""

if old_carousel_container in content:
    content = content.replace(old_carousel_container, new_carousel_container)
else:
    print("WARNING: Could not find old_carousel_container!")

old_item_wrapper = """            return (
              <div key={idx} style={{ 
                width: `${100 / allExercises.length}%`, 
                padding: '0 8px',
                pointerEvents: isThisActive ? 'auto' : 'none',
                opacity: isThisActive ? 1 : 0.4,
                transition: 'opacity 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>"""

new_item_wrapper = """            return (
              <div 
                key={idx} 
                data-index={idx}
                ref={(el) => { mainCarouselItemRefs.current[idx] = el; }}
                style={{ 
                  flex: '0 0 100%', 
                  padding: '0 8px',
                  scrollSnapAlign: 'center',
                  pointerEvents: isThisActive ? 'auto' : 'none',
                  opacity: isThisActive ? 1 : 0.4,
                  transition: 'opacity 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}
              >"""

if old_item_wrapper in content:
    content = content.replace(old_item_wrapper, new_item_wrapper)
else:
    print("WARNING: Could not find old_item_wrapper!")

# Remove the extra `</div>` that we removed from `new_carousel_container`
# The original structure was:
#           })}
#         </div>
#       </div>
#
#       {/* Globally Visible Shared Bottom Controls
old_end_carousel = """            );
          })}
        </div>
      </div>

      {/* Globally Visible Shared Bottom Controls"""

new_end_carousel = """            );
          })}
      </div>

      {/* Globally Visible Shared Bottom Controls"""

if old_end_carousel in content:
    content = content.replace(old_end_carousel, new_end_carousel)
else:
    print("WARNING: Could not find old_end_carousel!")

with open(path, 'w') as f:
    f.write(content)
