Add-Type -AssemblyName System.Speech
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$voices = $s.GetInstalledVoices() | Select-Object -ExpandProperty VoiceInfo
$pick = $voices | Where-Object { $_.Name -like '*Zira*' } | Select-Object -First 1
if (-not $pick) { $pick = $voices | Where-Object { $_.Gender -eq 'Female' } | Select-Object -First 1 }
if (-not $pick) { $pick = $voices | Select-Object -First 1 }
$s.SelectVoice($pick.Name)
$s.Rate = 0
$lines = [ordered]@{
  's1'  = "We're all token maxing right now. Building with AI, day and night. And we all quietly agree on one thing: A I is bad at frontend design. It's great at making stuff. HTML, pages, images, all day long. But when the design is wrong, you're stuck describing pixels in a chat box. And words lose intent."
  's2'  = "So we built Pikaso. Design review that lives on the mockup itself."
  's3'  = "The whole pipeline. Point at any element and comment. Every annotation is pinned to a real selector, with real coordinates. Your agent reads that file, edits the mockup, and the board reloads live. When the draft is right, you lock it. Every decision becomes a spec."
  's4a' = "This is a Pikaso board. Three mockups, one project. Everything here is plain HTML and JSON, sitting in the repo."
  's4c' = "I click any element and leave a comment. The comment becomes a pin, anchored to that exact selector, with its exact position. Six pins, two frames, thirty seconds. No describing, no guessing."
  's4e' = "Now Bob goes to work. It reads the annotations file, opens the mockup, and applies every pin. The board reloads the moment the file changes. Each resolved pin goes grey. Two batch applies, six annotations, no chat messages. This is the loop."
  's4g' = "Draft looks right? Lock it. Every comment, every decision condenses into a design spec, ready for implementation."
  's5'  = "I'm a design engineer, and this is how I make design with AI now. With Pikaso, you can make it too. Thank you."
}
foreach ($k in $lines.Keys) {
  $s.SetOutputToWaveFile("C:\Workspace\pikaso\video\voice\sapi\$k.wav")
  $s.Speak($lines[$k])
}
$s.Dispose()
Write-Output "done"
