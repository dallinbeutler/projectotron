<script lang="ts">
	import { base } from '$app/paths';
	import SessionCode from '$lib/components/SessionCode.svelte';
	import {
		createAndJoin,
		joinSession,
		leaveSession,
		sessionState
	} from '$lib/session.svelte';

	let code = $state('');
	let joining = $state(false);
	let error = $state('');

	async function handleCreate() {
		joining = true;
		error = '';
		try {
			await createAndJoin('projector');
			code = sessionState.code;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create session';
		} finally {
			joining = false;
		}
	}

	async function handleJoin(role: 'projector' | 'phone') {
		if (code.length !== 6) {
			error = 'Enter a 6-character session code';
			return;
		}
		joining = true;
		error = '';
		try {
			await joinSession(code, role);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to join session';
		} finally {
			joining = false;
		}
	}

	$effect(() => {
		if (sessionState.code && !code) code = sessionState.code;
	});
</script>

<div class="mx-auto max-w-4xl px-4 py-10">
	<section class="mb-10">
		<h1 class="mb-2 text-3xl font-bold tracking-tight">Projector calibration for sewing patterns</h1>
		<p class="max-w-2xl text-zinc-400">
			Project undistorted patterns onto fabric. Pair your projector and phone with a session code, calibrate
			with AprilTags, then reproject any image or PDF at true scale.
		</p>
	</section>

	<section class="mb-10 grid gap-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 md:grid-cols-2">
		<div class="flex flex-col gap-4">
			<h2 class="text-lg font-medium">Session</h2>
			<SessionCode bind:code readonly={!!sessionState.code} />
			{#if error}
				<p class="text-sm text-red-400">{error}</p>
			{/if}
			<div class="flex flex-wrap gap-2">
				{#if !sessionState.code}
					<button
						type="button"
						class="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
						disabled={joining}
						onclick={handleCreate}
					>
						Create session (projector)
					</button>
					<button
						type="button"
						class="rounded-lg border border-zinc-600 px-4 py-2 text-sm hover:border-zinc-400 disabled:opacity-50"
						disabled={joining}
						onclick={() => handleJoin('phone')}
					>
						Join as phone
					</button>
					<button
						type="button"
						class="rounded-lg border border-zinc-600 px-4 py-2 text-sm hover:border-zinc-400 disabled:opacity-50"
						disabled={joining}
						onclick={() => handleJoin('projector')}
					>
						Join as projector
					</button>
				{:else}
					<button
						type="button"
						class="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-400 hover:border-red-500 hover:text-red-400"
						onclick={leaveSession}
					>
						Leave session
					</button>
				{/if}
			</div>
		</div>

		<div class="flex flex-col gap-3">
			<h2 class="text-lg font-medium">Modes</h2>
			<p class="text-sm text-zinc-500">Join a session first, then open the mode for your device.</p>
			<nav class="flex flex-col gap-2">
				<a
					href="{base}/calibration/"
					class="rounded-lg border border-zinc-700 px-4 py-3 transition hover:border-amber-500 {sessionState.code
						? ''
						: 'pointer-events-none opacity-40'}"
				>
					<span class="font-medium">Calibration</span>
					<span class="mt-0.5 block text-xs text-zinc-500">Projector — fullscreen AprilTag pattern</span>
				</a>
				<a
					href="{base}/camera/"
					class="rounded-lg border border-zinc-700 px-4 py-3 transition hover:border-amber-500 {sessionState.code
						? ''
						: 'pointer-events-none opacity-40'}"
				>
					<span class="font-medium">Camera</span>
					<span class="mt-0.5 block text-xs text-zinc-500">Phone — scan markers &amp; sync calibration</span>
				</a>
				<a
					href="{base}/reproject/"
					class="rounded-lg border border-zinc-700 px-4 py-3 transition hover:border-amber-500 {sessionState.code
						? ''
						: 'pointer-events-none opacity-40'}"
				>
					<span class="font-medium">Reprojection</span>
					<span class="mt-0.5 block text-xs text-zinc-500">Projector — warp image/PDF without distortion</span>
				</a>
			</nav>
		</div>
	</section>

	<section class="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 text-sm text-zinc-500">
		<h2 class="mb-2 font-medium text-zinc-300">Quick start</h2>
		<ol class="list-inside list-decimal space-y-1">
			<li>On the projector: create a session and open <strong class="text-zinc-400">Calibration</strong> fullscreen.</li>
			<li>On your phone: join the same code and open <strong class="text-zinc-400">Camera</strong>.</li>
			<li>Point the phone at the projected tags until calibration locks.</li>
			<li>On the projector: open <strong class="text-zinc-400">Reprojection</strong>, upload your pattern, fine-tune scale.</li>
		</ol>
	</section>
</div>
